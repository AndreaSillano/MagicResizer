app_path="src-tauri/target/${target}/release/bundle/macOS/MagicResizer.app";

sign_app="3rd Party Mac Developer Application: Andrea Sillano (MFM2BXMT66)";

sign_install="3rd Party Mac Developer Installer: Andrea Sillano (MFM2BXMT66)";

build_name="src-tauri/target/release/bundle/macOS/MagicResizer.pkg";

profile="./embedded.provisionprofile";

cp_dir="src-tauri/target/release/bundle/macOS/MagicResizer.app/Contents/";


codesign --force -s "${sign_app}" --entitlements ./entitlements.plist "${app_path}";


productbuild --component "${app_path}" /Applications/ --sign "${sign_install}" "${build_name}";