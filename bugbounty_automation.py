#!/usr/bin/env python3
"""Bug bounty automation helper with optional Gemini-powered command generation."""

from __future__ import annotations

import argparse
import json
import os
import shlex
import subprocess
import sys
import urllib.error
import urllib.request
from typing import List

CORE_TOOLS = [
    "nmap",
    "gobuster",
    "ffuf",
    "whatweb",
    "dnsrecon",
    "nikto",
    "sqlmap",
    "xsser",
    "amass",
    "censys",
    "shodan",
    "theharvester",
    "subfinder",
    "httpx",
    "katana",
    "arjun",
    "dalfox",
    "hakrawler",
    "linkfinder",
    "unfurl",
    "waybackurls",
    "gf",
    "nuclei",
    "gau",
    "paramspider",
    "gauplus",
    "httprobe",
    "crobat",
    "naabu",
    "subjs",
    "getJS",
    "findomain",
    "massdns",
    "dnsx",
    "dnsgen",
    "dorkgen",
    "xray",
    "tlsx",
    "subzy",
    "shuffledns",
    "cloudenum",
    "github-subdomains",
    "git-dumper",
    "gitrob",
    "trufflehog",
    "cloudfail",
    "subjack",
    "altdns",
    "subover",
    "chaos-client",
    "dnsvalidator",
    "dnsreaper",
    "gospider",
    "gitleaks",
    "gitsecrets",
    "gophish",
    "smtp-user-enum",
    "smtp-sieve",
    "smtp-scanner",
    "imap-user-enum",
    "pop3-user-enum",
    "ldap-search",
    "kerbrute",
    "impacket",
    "bloodhound",
    "linpeas",
    "winpeas",
    "pspy",
    "linenum",
    "enum4linux",
    "nmap-vulners",
    "nuclei-templates",
    "httpx-templates",
    "waybackmachine",
    "urlscan",
    "securityheaders",
    "wappalyzer",
    "lazagne",
    "mimipenguin",
    "chisel",
    "socat",
    "ncat",
    "tcpdump",
    "wireshark",
]

GEMINI_ENDPOINT = (
    "https://generativelanguage.googleapis.com/v1beta/"
    "models/gemini-1.5-flash:generateContent?key="
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate bug bounty recon commands using Gemini or a local template."
    )
    parser.add_argument("target", help="Target domain or CIDR block.")
    parser.add_argument(
        "--scope",
        default="",
        help="Additional scope notes (e.g. subdomains, assets, exclusions).",
    )
    parser.add_argument(
        "--goals",
        default="",
        help="Goal or focus area (e.g. subdomain discovery, vuln scanning).",
    )
    parser.add_argument(
        "--list-tools", action="store_true", help="Print the supported tool list."
    )
    parser.add_argument(
        "--run",
        action="store_true",
        help="Execute the generated commands sequentially.",
    )
    parser.add_argument(
        "--output",
        default="",
        help="Write the generated commands to a file.",
    )
    return parser.parse_args()


def generate_prompt(target: str, scope: str, goals: str) -> str:
    scope_line = f"Scope: {scope}" if scope else "Scope: not provided"
    goals_line = f"Goals: {goals}" if goals else "Goals: general recon"
    tool_list = ", ".join(CORE_TOOLS)
    return (
        "You are a bug bounty automation assistant. "
        "Return a concise list of shell commands, one per line. "
        "Use only these tools: "
        f"{tool_list}. "
        "Include placeholder output directories when needed. "
        "Do not include explanations or markdown.\n"
        f"Target: {target}\n{scope_line}\n{goals_line}\n"
    )


def request_gemini(prompt: str, api_key: str) -> str:
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": prompt,
                    }
                ],
            }
        ]
    }
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        GEMINI_ENDPOINT + api_key,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            response_data = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f"Gemini API error: {exc.read().decode('utf-8')}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Gemini API request failed: {exc}") from exc

    parsed = json.loads(response_data)
    candidates = parsed.get("candidates", [])
    if not candidates:
        raise RuntimeError("Gemini API returned no candidates.")
    content = candidates[0].get("content", {})
    parts = content.get("parts", [])
    if not parts:
        raise RuntimeError("Gemini API returned empty content parts.")
    return parts[0].get("text", "").strip()


def local_fallback(target: str) -> List[str]:
    return [
        f"subfinder -d {shlex.quote(target)} -all -silent -o out/subdomains.txt",
        f"httpx -l out/subdomains.txt -silent -o out/live_hosts.txt",
        f"nuclei -l out/live_hosts.txt -o out/nuclei_findings.txt",
        f"katana -u https://{shlex.quote(target)} -o out/urls.txt",
        f"ffuf -w wordlists/common.txt -u https://{shlex.quote(target)}/FUZZ -o out/ffuf.json",
    ]


def normalize_commands(raw_text: str) -> List[str]:
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    commands = []
    for line in lines:
        if line.startswith("#"):
            continue
        commands.append(line)
    return commands


def filter_allowed_tools(commands: List[str]) -> List[str]:
    allowed = set(CORE_TOOLS)
    filtered = []
    for command in commands:
        parts = shlex.split(command)
        if not parts:
            continue
        tool = parts[0]
        if tool in allowed:
            filtered.append(command)
    return filtered


def execute_commands(commands: List[str]) -> int:
    for command in commands:
        print(f"\n[run] {command}")
        try:
            subprocess.run(command, shell=True, check=True)
        except subprocess.CalledProcessError as exc:
            print(f"Command failed: {exc}")
            return exc.returncode
    return 0


def main() -> int:
    args = parse_args()
    if args.list_tools:
        print("\n".join(CORE_TOOLS))
        return 0

    prompt = generate_prompt(args.target, args.scope, args.goals)
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()

    if api_key:
        try:
            raw_text = request_gemini(prompt, api_key)
            commands = normalize_commands(raw_text)
            commands = filter_allowed_tools(commands)
            if not commands:
                raise RuntimeError("Gemini output did not include allowed tools.")
        except RuntimeError as exc:
            print(f"Gemini error: {exc}")
            print("Falling back to local command template.")
            commands = local_fallback(args.target)
    else:
        print("GEMINI_API_KEY not set. Using local command template.")
        commands = local_fallback(args.target)

    output_text = "\n".join(commands)
    if args.output:
        os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)
        with open(args.output, "w", encoding="utf-8") as handle:
            handle.write(output_text + "\n")

    print(output_text)

    if args.run:
        return execute_commands(commands)

    return 0


if __name__ == "__main__":
    sys.exit(main())
