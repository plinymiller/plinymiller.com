# Sample sites

Gated design studies for Pliny Miller Design. The public list is [`samples/index.html`](index.html), linked from the studio footer.

Each study’s HTML pages are encrypted with [StatiCrypt](https://github.com/robinmoisson/staticrypt) 3.5.4: AES-256-CBC, with a key derived from the passphrase using PBKDF2 (600,000 iterations, the library’s current default). The files committed under `samples/<name>/` are ciphertext plus shared assets (CSS, fonts, drawings). They do not contain the page copy or the password.

This repository is public. Plaintext page source is not stored here, including in git history. For the Kinville study it lives only in the agent store at `/cursor/stores/self/kinville-src/` (page fragments, layout, assets, login template, salt file, and `build.mjs`). The Tuff Sledding study lives only at `/cursor/stores/self/tuff-sledding-src/`. Do not copy either directory into the repo. `samples/_src/` must not be added.

Passwords are not stored in this repository.

## Sign-in

The encryption key is the string `username:password`: the username, trimmed and lowercased, a colon, then the password exactly as it was issued. The form asks for the two fields separately and joins them in the browser. A wrong username fails the same way a wrong password does.

“Remember me for 30 days” stores StatiCrypt’s derived key in `localStorage` on that browser. Every page in one study shares a salt, so remembering on one page opens the others. Add `?staticrypt_logout` to a sample URL to forget it. The Kinville footer link “Lock this sample” does that.

## Re-encrypt Kinville

From a checkout of this repo, with the private source available:

```
node /cursor/stores/self/kinville-src/build.mjs
```

The script reads `/cursor/stores/self/kinville-src/`, encrypts with `npx staticrypt@3.5.4`, checks that a decrypt round trip matches, and writes only ciphertext and shared assets to `samples/kinville/`. It uses the salt file in that private directory so existing “Remember me” sessions keep working until the password changes. It reads `SAMPLE_USERNAME` and `SAMPLE_PASSWORD` when those are set, otherwise `/cursor/stores/self/credentials/kinville-sample.txt`. It does not print the password, and it stops if the username, password, or passphrase appears anywhere in the repo checkout.

Set `SAMPLE_REPO` if the shell’s current directory is not the repo root.

Commit the updated files under `samples/kinville/` only. Do not commit the private source.

## Re-encrypt Tuff Sledding

From a checkout of this repo:

```
node /cursor/stores/self/tuff-sledding-src/build.mjs
```

The script reads the private site in that directory, encrypts every HTML page with one shared salt, and writes only ciphertext and shared assets to `samples/tuff-sledding/`. It reads `SAMPLE_USERNAME` and `SAMPLE_PASSWORD` when those are set, otherwise `/cursor/stores/self/credentials/tuff-sledding-sample.txt`. Remember-me for this sample uses its own browser storage keys, so it does not clear a Kinville sign-in. Commit the files under `samples/tuff-sledding/` only.

Node 20 or newer is required. The first build on a machine needs network access so `npx` can fetch StatiCrypt.

## Add a sample

1. Keep the plaintext pages outside this repository, in a private directory, the way Kinville uses `/cursor/stores/self/kinville-src/`.
2. Add a login template with Username and Password fields. The passphrase passed to StatiCrypt must be `username:password`, not the password alone. The Kinville template is `login-template.html` in that private directory. Keep the `/*[|…|]*/0` tokens in the script intact.
3. Encrypt every HTML page with the same salt. Use `--remember 30`. One recursive StatiCrypt run does this.
4. Write only the ciphertext and the assets the decrypted pages request into `samples/<name>/`.
5. Add a card on `samples/index.html`.
6. Keep the password out of git, commit messages, and pull requests.

## Rotate a password

1. Choose a new password of at least 16 characters, letters and digits only, with no ambiguous characters (skip `0`, `O`, `o`, `1`, `I`, `l`, and `L`).
2. Update it in the private credentials file, or export `SAMPLE_USERNAME` and `SAMPLE_PASSWORD` for the build. Do not write it into the repo.
3. Run `node /cursor/stores/self/kinville-src/build.mjs` from the repository root. Re-encrypting with the same salt is fine; the old passphrase stops decrypting the new files.
4. Commit the new ciphertext and push it. Remember-me sessions from the old passphrase fail and clear themselves.

## What this repo publishes

`samples/kinville/` is the encrypted study plus the CSS, fonts, and drawings the decrypted pages request. Those assets do not include the written pages or the password. Fonts are Bebas Neue, Outfit, and Fraunces, under the SIL Open Font License.

`samples/tuff-sledding/` is the encrypted Tuff Sledding draft plus the CSS and drawings its pages request. The written pages are not in this repository.

`samples/README.md` is listed in the Jekyll exclude so the site does not serve it. It remains in the git repo and contains no secrets.
