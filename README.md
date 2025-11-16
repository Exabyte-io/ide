[![npm version](https://badge.fury.io/js/%40exabyte-io%2Fide.svg)](https://badge.fury.io/js/%40exabyte-io%2Fide)
[![License: Apache](https://img.shields.io/badge/License-Apache-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)

# ide

Infrastructure DEfinitions - ide - houses Infrastructure entity definitions for use in the Mat3ra platform.


### Installation

For usage within a javascript project:

```bash
npm install @exabyte-io/ide
```

For development:

```bash
git clone https://github.com/Exabyte-io/ide.git
```


### Contribution

This repository is an [open-source](LICENSE.md) work-in-progress and we welcome contributions.

We regularly deploy the latest code containing all accepted contributions online as part of the
[Mat3ra.com](https://mat3ra.com) platform, so contributors will see their code in action there.

See [ESSE](https://github.com/Exabyte-io/esse) for additional context regarding the data schemas used here.

Useful commands for development:

```bash
# run linter without persistence
npm run lint

# run linter and save edits
npm run lint:fix

# compile the library
npm run transpile

# run tests
npm run test
```

## Using Linter

Linter setup will prevent committing files that don't adhere to the code standard. It will
attempt to fix what it can automatically prior to the commit in order to reduce diff noise. This can lead to "unexpected" behavior where a
file that is staged for commit is not identical to the file that actually gets committed. This happens
in the `lint-staged` directive of the `package.json` file (by using a `husky` pre-commit hook). For example,
if you add extra whitespace to a file, stage it, and try to commit it, you will see the following:

```bash
➜  repo-js git:(feature/cool-feature) ✗ git commit -m "Awesome feature works great"
✔ Preparing...
✔ Running tasks...
✖ Prevented an empty git commit!
✔ Reverting to original state because of errors...
✔ Cleaning up...

  ⚠ lint-staged prevented an empty git commit.
  Use the --allow-empty option to continue, or check your task configuration

husky - pre-commit hook exited with code 1 (error)
```

The staged change may remain but will not have been committed. Then it will look like you still have a staged
change to commit, but the pre-commit hook will not actually commit it for you, quite frustrating! Styling can
be applied manually and fixed by running:

```bash
npm run lint:fix
```

In which case, you may need to then add the linter edits to your staging, which in the example above, puts the
file back to identical with the base branch, resulting in no staged changes whatsoever.

IDe
===

The `IDe` package sits adjacent to `WoDe` in the Mat3ra workflow ecosystem in that workflows are
intended to be independent and de-coupled from the details of the computational parameters employed
when executing a workflow. The main entities provided by `IDe` are not quite the same as other `De` libraries:

- `ComputedEntityMixin` - provides methods for managing compute-specific parameters
- `RMSNotificationHandler` - wrapped in an enum for email notifications

and are used in slightly different ways within `WoDe` and the platform directly.

## Links

1. Overview of the platform Infrastructure: https://docs.mat3ra.com/infrastructure/overview/
2. Clusters in the infrastructure: https://docs.mat3ra.com/infrastructure/clusters/overview/
3. Resource management overview: https://docs.mat3ra.com/infrastructure/resource/overview/
