#!/usr/bin/env node

/**
 * Wraps `expo start` and pins REACT_NATIVE_PACKAGER_HOSTNAME to the
 * IPv4 address this machine actually uses to reach the internet.
 *
 * Why this exists: Expo/Metro auto-detects the LAN IP to embed in the
 * QR code (via the `lan-network` package). That detector spawns a
 * subprocess with a 500ms timeout and, if it doesn't get a clean
 * answer in time, silently falls back to 127.0.0.1 - which no phone
 * can ever reach. It also gets confused on machines with more than
 * one active network adapter (e.g. a second NIC that never got a
 * real DHCP lease and sits on a 169.254.x.x address), which is
 * exactly this machine's setup (see `ipconfig` - "Ethernet 3").
 * That's the "Something went wrong" / "picks some other wifi" symptom
 * in Expo Go, and it shows up most on unfamiliar networks (a new
 * hotspot) because there's no warm/cached route yet.
 *
 * Fix: ask the OS routing table directly - a UDP "connect" sends no
 * packet, it just asks the kernel which local interface/address it
 * would use to reach the public internet - and hand that address to
 * Metro explicitly so it never has to guess.
 */

const os = require('os');
const dgram = require('dgram');
const { spawn } = require('child_process');

function isLinkLocal(address) {
  return address.startsWith('169.254.');
}

function viaDefaultRoute() {
  return new Promise((resolve) => {
    const socket = dgram.createSocket('udp4');
    const done = (address) => {
      socket.close();
      resolve(address);
    };
    socket.once('error', () => done(null));
    // 1.1.1.1:53 is never actually contacted - UDP "connect" is a
    // local, offline call that just resolves the outbound route.
    socket.connect(53, '1.1.1.1', () => {
      const { address } = socket.address();
      done(address && address !== '0.0.0.0' ? address : null);
    });
  });
}

function fallbackFromInterfaces() {
  const candidates = [];
  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    for (const addr of addrs || []) {
      if (addr.family !== 'IPv4' || addr.internal || isLinkLocal(addr.address)) continue;
      candidates.push({ name, address: addr.address });
    }
  }
  const wifi = candidates.find((c) => /wi-?fi|wlan/i.test(c.name));
  return (wifi || candidates[0] || {}).address || null;
}

async function pickHostname() {
  const routed = await viaDefaultRoute();
  if (routed && !isLinkLocal(routed)) return routed;
  return fallbackFromInterfaces();
}

async function main() {
  const hostname = await pickHostname();
  const env = { ...process.env };

  if (hostname) {
    env.REACT_NATIVE_PACKAGER_HOSTNAME = hostname;
    console.log(`[dev] Advertising Metro/Expo at ${hostname} (auto-detected, overrides Expo's own guess).`);
  } else {
    console.warn('[dev] Could not auto-detect a LAN IPv4 address; leaving this to Expo (may be unreliable).');
  }

  const args = process.argv.slice(2);
  // Invoke the expo CLI's JS entry point directly with this same
  // node binary - spawning the `expo`/`expo.cmd` shim instead runs
  // into inconsistent behavior across platforms (on Windows, `.cmd`
  // shims need a shell, which brings back quoting/escaping risk).
  const expoCli = require.resolve('expo/bin/cli');
  const child = spawn(process.execPath, [expoCli, 'start', ...args], {
    stdio: 'inherit',
    env,
  });

  child.on('exit', (code) => process.exit(code == null ? 1 : code));
  child.on('error', (err) => {
    console.error('[dev] Failed to launch expo start:', err);
    process.exit(1);
  });
}

main();
