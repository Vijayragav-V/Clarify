const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const tools = path.join(root, '.tools');
const sdk = path.join(tools, 'android-sdk');
const adb = path.join(sdk, 'platform-tools', 'adb.exe');
const env = { ...process.env, ANDROID_HOME: sdk, ANDROID_SDK_ROOT: sdk,
  ANDROID_AVD_HOME: path.join(tools, 'avd'), EXPO_NO_TELEMETRY: '1' };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function run(args, timeout = 30000) {
  return execFileSync(adb, args, { env, windowsHide: true, encoding: 'utf8', timeout }).trim();
}
function background(file, args, cwd, label) {
  const out = fs.openSync(path.join(tools, `${label}.log`), 'a');
  const err = fs.openSync(path.join(tools, `${label}-error.log`), 'a');
  const child = spawn(file, args, { cwd, env, detached: true, windowsHide: true, stdio: ['ignore', out, err] });
  child.unref();
  fs.closeSync(out); fs.closeSync(err);
}
async function available(url) {
  try { return (await fetch(url, { signal: AbortSignal.timeout(2000) })).ok; }
  catch { return false; }
}
async function main() {
  if (!fs.existsSync(adb)) throw new Error('Android SDK is missing from .tools/android-sdk.');
  if (!await available('http://127.0.0.1:3000/health')) {
    background(process.execPath, ['dist/app.js'], path.join(root, 'server'), 'server');
  }
  if (!await available('http://127.0.0.1:8081/status')) {
    background(process.execPath, [path.join(root, 'client/node_modules/expo/bin/cli'), 'start', '--localhost', '--port', '8081', '--max-workers', '2'], path.join(root, 'client'), 'metro');
  }
  const devices = run(['devices']);
  if (!devices.includes('emulator-')) {
    background(path.join(sdk, 'emulator', 'emulator.exe'), ['-avd', 'Clarify_API_35', '-memory', '2048', '-cores', '2', '-gpu', 'software', '-no-boot-anim'], root, 'emulator');
  }
  console.log('Waiting for Android to boot (first launch can take several minutes)...');
  const deadline = Date.now() + 360000;
  let booted = false;
  while (Date.now() < deadline) {
    try { booted = run(['-e', 'shell', 'getprop', 'sys.boot_completed']) === '1'; } catch {}
    if (booted) break;
    await sleep(3000);
  }
  if (!booted) throw new Error('Android did not finish booting. Check .tools/emulator-error.log.');
  if (!run(['-e', 'shell', 'pm', 'list', 'packages', 'host.exp.exponent']).includes('host.exp.exponent')) {
    console.log('Installing Expo Go...');
    run(['-e', 'install', '-r', path.join(tools, 'downloads', 'expo-go.apk')], 180000);
  }
  for (let attempt = 0; attempt < 60; attempt++) {
    if (await available('http://127.0.0.1:8081/status')) break;
    if (attempt === 59) throw new Error('Expo did not start. Check .tools/metro-error.log.');
    await sleep(2000);
  }
  run(['-e', 'reverse', 'tcp:8081', 'tcp:8081']);
  run(['-e', 'shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', 'exp://127.0.0.1:8081', 'host.exp.exponent']);
  console.log('Clarify is opening in the Android emulator.');
  console.log('AI features need OPENAI_API_KEY and LEMONFOX_API_KEY in server/.env.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
