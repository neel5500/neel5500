# Bug Bounty Automation Helper

This repository includes a lightweight automation helper that generates bug bounty recon commands. It can use the Gemini API for AI-assisted command generation, or fall back to a local template if no API key is configured.

## Features

- Generates recon command sequences using a curated list of common bug bounty tools.
- Optional Gemini integration for AI-assisted command selection.
- Safe filtering to ensure only approved tools are emitted.
- Optional execution mode to run the generated commands sequentially.

## Requirements

- Python 3.9+
- (Optional) `GEMINI_API_KEY` environment variable for AI-assisted output.

## Usage

Generate commands (default template if no API key is set):

```bash
python3 bugbounty_automation.py example.com
```

Provide scope notes and goals:

```bash
python3 bugbounty_automation.py example.com --scope "subdomains only" --goals "subdomain discovery"
```

Write output to a file:

```bash
python3 bugbounty_automation.py example.com --output out/commands.sh
```

Execute the generated commands sequentially:

```bash
python3 bugbounty_automation.py example.com --run
```

List the supported tools:

```bash
python3 bugbounty_automation.py example.com --list-tools
```

## Gemini API Setup

Export your Gemini API key before running the script:

```bash
export GEMINI_API_KEY="your_key_here"
```

The script will call Gemini and normalize the returned command list. If Gemini fails or the API key is missing, it falls back to a local command template.
