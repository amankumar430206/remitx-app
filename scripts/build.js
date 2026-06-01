#!/usr/bin/env node
/**
 * RemitX Mobile — Build Helper
 *
 * Usage:
 *   node scripts/build.js [profile] [platform] [options]
 *
 * Profiles:   development | preview | production
 * Platforms:  android | ios | all
 *
 * Options:
 *   --local       Build locally (requires Android SDK / Xcode — no EAS account needed)
 *   --no-wait     Submit build and exit immediately (don't wait for completion)
 *   --list        List recent builds for this project
 *
 * Examples:
 *   node scripts/build.js preview android
 *   node scripts/build.js preview all
 *   node scripts/build.js preview android --local
 *   node scripts/build.js production android
 *   node scripts/build.js --list
 */

import { execSync, spawn } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ─── ANSI colors ─────────────────────────────────────────────────────────────
const C = {
  reset: '\x1b[0m',
  bold:  '\x1b[1m',
  dim:   '\x1b[2m',
  green: '\x1b[32m',
  cyan:  '\x1b[36m',
  yellow:'\x1b[33m',
  red:   '\x1b[31m',
  blue:  '\x1b[34m',
  white: '\x1b[37m',
}
const bold   = (s) => `${C.bold}${s}${C.reset}`
const dim    = (s) => `${C.dim}${s}${C.reset}`
const green  = (s) => `${C.green}${s}${C.reset}`
const cyan   = (s) => `${C.cyan}${s}${C.reset}`
const yellow = (s) => `${C.yellow}${s}${C.reset}`
const red    = (s) => `${C.red}${s}${C.reset}`
const blue   = (s) => `${C.blue}${s}${C.reset}`

// ─── Config ───────────────────────────────────────────────────────────────────
const PROFILES = {
  development: {
    label: 'Development (debug APK, dev API)',
    envFile: '.env.development',
    color: yellow,
    icon: '🔧',
  },
  preview: {
    label: 'Preview (release APK, staging API — share with team)',
    envFile: '.env.staging',
    color: cyan,
    icon: '🧪',
  },
  production: {
    label: 'Production (AAB/IPA for store)',
    envFile: '.env.production',
    color: green,
    icon: '🚀',
  },
}

const PLATFORMS = ['android', 'ios', 'all']

// ─── Helpers ─────────────────────────────────────────────────────────────────
function print(msg) { process.stdout.write(msg + '\n') }

function banner() {
  print('')
  print(bold(`${blue('●')} RemitX Mobile Build Helper`))
  print(dim('─────────────────────────────────────────'))
}

function usage() {
  banner()
  print('')
  print(bold('Usage:'))
  print(`  ${cyan('node scripts/build.js')} ${yellow('<profile>')} ${yellow('<platform>')} ${dim('[--local] [--no-wait]')}`)
  print(`  ${cyan('node scripts/build.js')} ${dim('--list')}`)
  print('')
  print(bold('Profiles:'))
  for (const [key, p] of Object.entries(PROFILES)) {
    print(`  ${p.color(key.padEnd(14))} ${dim(p.label)}`)
  }
  print('')
  print(bold('Platforms:'))
  print(`  ${yellow('android')}  ${dim('APK (preview) or AAB (production)')}`)
  print(`  ${yellow('ios')}      ${dim('Simulator (development) or IPA (preview/production)')}`)
  print(`  ${yellow('all')}      ${dim('Both platforms')}`)
  print('')
  print(bold('Examples:'))
  print(`  ${dim('# Share a preview APK with the team (EAS cloud build):')}`)
  print(`  ${cyan('node scripts/build.js preview android')}`)
  print('')
  print(`  ${dim('# Build locally without EAS account (needs Android SDK):')}`)
  print(`  ${cyan('node scripts/build.js preview android --local')}`)
  print('')
  print(`  ${dim('# Build for both platforms:')}`)
  print(`  ${cyan('node scripts/build.js preview all')}`)
  print('')
  print(`  ${dim('# List recent builds + sharing links:')}`)
  print(`  ${cyan('node scripts/build.js --list')}`)
  print('')
}

function checkEasCli() {
  try {
    execSync('eas --version', { stdio: 'pipe' })
    return true
  } catch {
    print(red('✗ EAS CLI not found.'))
    print(yellow('  Install it globally:  npm install -g eas-cli'))
    print(yellow('  Then log in:          eas login'))
    print('')
    return false
  }
}

function loadEnvFile(envFile) {
  const path = resolve(ROOT, envFile)
  if (!existsSync(path)) {
    print(yellow(`⚠  ${envFile} not found — using defaults from .env`))
    return {}
  }
  const vars = {}
  const lines = readFileSync(path, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    vars[key] = val
  }
  return vars
}

function runBuild({ profile, platform, local, noWait }) {
  if (!checkEasCli()) process.exit(1)

  const p = PROFILES[profile]
  banner()
  print('')
  print(`${p.icon}  ${bold(`Building ${p.color(profile)} for ${yellow(platform)}`)}\n`)

  // Show env vars that will be used
  const envVars = loadEnvFile(p.envFile)
  if (Object.keys(envVars).length) {
    print(dim('  Environment:'))
    for (const [k, v] of Object.entries(envVars)) {
      if (k !== 'EXPO_PUBLIC_TENANT_SLUG') {
        print(dim(`    ${k} = ${v}`))
      }
    }
    print('')
  }

  // Build the eas command
  const args = ['build', '--profile', profile, '--platform', platform]
  if (local)   args.push('--local')
  if (noWait)  args.push('--non-interactive')
  if (!noWait && !local) {
    print(dim('  Build will run on EAS cloud. You can close this terminal — the build'))
    print(dim('  will continue and you\'ll receive a sharing link when done.\n'))
    print(dim('  To skip waiting, re-run with --no-wait\n'))
  }

  if (local) {
    print(yellow('  ⚡ Local build mode — requires Android SDK / Xcode\n'))
  }

  print(dim(`  Running: eas ${args.join(' ')}\n`))
  print(dim('─────────────────────────────────────────'))
  print('')

  // Inject env vars for cloud build (EAS reads them from eas.json, but for
  // local builds we inject them into process env so metro picks them up)
  const env = { ...process.env, ...envVars }

  const proc = spawn('eas', args, {
    cwd: ROOT,
    stdio: 'inherit',
    env,
    shell: true,
  })

  proc.on('close', (code) => {
    print('')
    print(dim('─────────────────────────────────────────'))
    if (code === 0) {
      print(green(`✓  Build finished successfully!`))
      if (!local && !noWait) {
        print(cyan('   The sharing URL was printed above.'))
        print(cyan('   Share it with your team — they can install directly on their device.'))
        print(cyan('   Android: tap the link → download APK → enable "Install from unknown sources"'))
        print(cyan('   iOS:     open link on device → follow TestFlight / ad-hoc prompts'))
      }
      if (local) {
        print(cyan('   APK saved to the project root.'))
        print(cyan('   Transfer it to a device or upload to Google Drive / Slack to share.'))
      }
    } else {
      print(red(`✗  Build failed (exit ${code})`))
      print(yellow('   Check the output above for errors.'))
      print(yellow('   Common fixes:'))
      print(yellow('   • Run `eas login` if you see an auth error'))
      print(yellow('   • Run `eas build:configure` if this is your first EAS build'))
    }
    print('')
    process.exit(code ?? 1)
  })
}

function listBuilds() {
  if (!checkEasCli()) process.exit(1)
  banner()
  print('')
  print(bold('Recent builds:\n'))
  print(dim('─────────────────────────────────────────'))
  try {
    execSync('eas build:list --limit 10', { cwd: ROOT, stdio: 'inherit' })
  } catch (e) {
    print(red('Failed to list builds. Make sure you are logged in: eas login'))
  }
  print('')
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)

if (args.includes('--list')) {
  listBuilds()
  process.exit(0)
}

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  usage()
  process.exit(0)
}

const profile  = args.find(a => Object.keys(PROFILES).includes(a))
const platform = args.find(a => PLATFORMS.includes(a)) ?? 'android'
const local    = args.includes('--local')
const noWait   = args.includes('--no-wait')

if (!profile) {
  print(red(`\n✗  Unknown profile. Valid profiles: ${Object.keys(PROFILES).join(', ')}\n`))
  usage()
  process.exit(1)
}

runBuild({ profile, platform, local, noWait })
