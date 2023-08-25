
app_path="src-tauri/target/${target}/release/bundle/macOS/MagicResizer.app";

sign_app="3rd Party Mac Developer Application: Andrea Sillano (MFM2BXMT66)";

sign_install="3rd Party Mac Developer Installer: Andrea Sillano (MFM2BXMT66)";

build_name="src-tauri/target/release/bundle/macOS/MyApp.pkg";

profile="./embedded.provisionprofile";

cp_dir="src-tauri/target/release/bundle/macOS/MagicResizer.app/Contents/";

npm run tauri build;
cp -r "${app_path}"
cp "${profile}" "${cp_dir}";

echo "add the <key>LSApplicationCategoryType</key>
		<string>public.app-category.photography</string> to Info.Plist"