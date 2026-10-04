// 配布キーはファイルへ記録せず、検証時の環境変数で渡す。
exports.openApp = async function openApp(page, base = 'http://localhost:3000/linemmk/') {
  const key = process.env.MITEMITE_TEST_ACCESS_KEY;
  if (!key) throw new Error('Set MITEMITE_TEST_ACCESS_KEY before capturing or verifying the app.');
  await page.goto(`${base}#access=${encodeURIComponent(key)}`);
  await page.getByRole('link', { name: '使い方', exact: true }).waitFor();
};
