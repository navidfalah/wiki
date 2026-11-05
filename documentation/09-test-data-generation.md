# 09 — Test data generation (retired)

The Python sample-data generator scripts were removed during the JavaScript migration. They wrote generated files into `data/raw/`, which is maintained by humans and is not modified by the compiler.

Existing sample files remain available in their checked-in locations. To compile sources, add files to `data/raw/` and run `node compiler/main.js`. This project no longer provides commands to synthesize or archive raw test data.
