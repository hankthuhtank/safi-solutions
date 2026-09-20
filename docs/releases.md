# SafiSolutions Product Release Process

Use this whenever you publish a new installer/package.

## Version policy

Recommended customer promise:

- Purchase of `1.x` includes future `1.x` maintenance/minor updates when released.
- A future `2.0` may be a separate optional paid major upgrade.
- Customers can keep using the version they purchased; a major upgrade should not disable an older purchase.

## Release steps

1. Increment the product version.
2. Build the final Windows installer/package.
3. Test install, launch, save/export, update/repair if applicable, and uninstall.
4. Scan the final package.
5. Generate SHA-256 with `tools/hash-releases.ps1`.
6. Upload to a new versioned R2 object key.
7. Update the corresponding `PRODUCT_FILE_*` value in the Worker configuration.
8. Deploy the Worker configuration change.
9. Verify an existing customer's update request returns the current entitled build.
10. Keep the prior object until the new release has been stable long enough that rollback is no longer likely.

## Naming

Prefer predictable versioned names:

```text
Padeff-1.0.0.zip
Piktoor-1.0.0.zip
Kwezeen-1.0.0.zip
DoqCorp-1.0.0.zip
Brandur-1.0.0.zip
```

Never upload different bytes under the same version name. Versioned names make support and rollback much easier.
