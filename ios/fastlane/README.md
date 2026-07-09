fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios verify_metadata

```sh
[bundle exec] fastlane ios verify_metadata
```

Read back listing text from App Store Connect (debug)

### ios metadata

```sh
[bundle exec] fastlane ios metadata
```

Upload App Store text metadata only (description, keywords, URLs, etc.)

### ios screenshots

```sh
[bundle exec] fastlane ios screenshots
```

Upload screenshots only from fastlane/screenshots/ (no listing text)

### ios metadata_and_screenshots

```sh
[bundle exec] fastlane ios metadata_and_screenshots
```

Upload metadata and screenshots from fastlane/screenshots/

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
