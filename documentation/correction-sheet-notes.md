# Correction sheet provenance and preparation

Saved 2026-10-16 from the user-provided pasted text of a page titled “42 EvalHub / Tokenizer”. The original page URL and scale version were not supplied. This is a reference checklist, not a verified current official campus evaluation scale. The pasted contents are preserved in [correction-sheet.txt](correction-sheet.txt); the project subject remains [subject-v1.1.txt](subject-v1.1.txt).

The sheet broadly matches the subject: repository layout, token name containing 42, README choices, documentation, code/security review, public explorer details and token operations, plus the multisig bonus.

## Live deployment during defense

The deployment review explicitly says: “With the help of the person being evaluated, you must deploy this token.” Prepare to reproduce deployment during the defense, even though the project already has a public verified deployment. The subject requires public deployment and deployment materials but does not explicitly require redeployment during the defense.

Use the React client at `/deploy`; follow [deployment instructions](../deployment/README.md). A fresh deployment creates a separate contract address with its own fixed supply of 42,000 CLUB42. Keep rehearsal addresses and transaction hashes separate from the existing deployment records unless intentionally replacing them. Use Sepolia test funds; the user signs in MetaMask. Source verification is separate from deployment.

Rehearsal remains pending. Be ready to explain compilation, ABI versus bytecode, wallet signing, gas, constructor execution, transaction confirmation, explorer verification, and basic token interactions.

## Other review points

- Explain the token’s lack of privileged owner/admin functions and the treasury’s distinct two-of-three organizer permissions.
- Show the token ticker, name, network, address, and working operations in the explorer.
- Keep deployment materials free of secrets. Public wallet addresses are not private keys.
- Demonstrate and explain the multisig bonus only after mandatory requirements pass.
- Generic introductory wording, such as memory-leak checks, should be interpreted in the context of the submitted technology and official evaluation instructions.
