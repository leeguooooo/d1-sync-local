const locales = {
  en: {
    title: '🚀 D1 Sync to Local',
    description: 'Sync Cloudflare D1 remote databases to local development environment',
    usage: 'Usage',
    options: 'Options',
    examples: 'Examples',
    shortAlias: 'Short alias',
    showVersion: 'Show version',
    showHelp: 'Show help',
    readingConfig: 'Reading wrangler.toml...',
    foundConfig: 'Found wrangler.toml',
    configNotFound: 'wrangler.toml not found in current directory',
    noDatabases: 'No D1 databases found in wrangler.toml',
    noLocalDb: 'No local D1 database configuration found',
    localDatabase: 'Local database',
    selectSource: 'Select source database to sync from:',
    binding: 'Binding',
    noDbSelected: 'No database selected',
    cancelled: 'Cancelled',
    syncWarning: 'This will sync {source} to local database',
    confirmReplace: 'All local data will be replaced. Continue?',
    exportingDb: 'Exporting source database...',
    exportComplete: 'Export completed',
    cleaningLocal: 'Cleaning local database...',
    cleanedLocal: 'Cleaned local database ({count} files)',
    processingExport: 'Processing export file...',
    exportProcessed: 'Export file processed',
    importingLocal: 'Importing to local database...',
    importComplete: 'Import completed',
    syncedTables: 'Synced {count} tables:',
    records: 'records',
    unableToCount: 'unable to count',
    syncSuccess: '✨ Sync completed successfully!',
    validationFailed: 'Validation failed:',
    error: 'Error:'
  },
  'zh-CN': {
    title: '🚀 D1 同步到本地',
    description: '将 Cloudflare D1 远程数据库同步到本地开发环境',
    usage: '使用方法',
    options: '选项',
    examples: '示例',
    shortAlias: '简短别名',
    showVersion: '显示版本',
    showHelp: '显示帮助',
    readingConfig: '正在读取 wrangler.toml...',
    foundConfig: '找到 wrangler.toml',
    configNotFound: '当前目录未找到 wrangler.toml',
    noDatabases: 'wrangler.toml 中未找到 D1 数据库',
    noLocalDb: '未找到本地 D1 数据库配置',
    localDatabase: '本地数据库',
    selectSource: '选择要同步的源数据库：',
    binding: '绑定',
    noDbSelected: '未选择数据库',
    cancelled: '已取消',
    syncWarning: '将把 {source} 同步到本地数据库',
    confirmReplace: '所有本地数据将被替换。是否继续？',
    exportingDb: '正在导出源数据库...',
    exportComplete: '导出完成',
    cleaningLocal: '正在清理本地数据库...',
    cleanedLocal: '已清理本地数据库（{count} 个文件）',
    cleaningDatabase: '正在清理数据库...',
    processingExport: '正在处理导出文件...',
    exportProcessed: '导出文件处理完成',
    importingLocal: '正在导入到本地数据库...',
    importComplete: '导入完成',
    syncedTables: '已同步 {count} 个表：',
    records: '条记录',
    unableToCount: '无法统计',
    syncSuccess: '✨ 同步成功完成！',
    validationFailed: '验证失败：',
    error: '错误：'
  },
  'zh-TW': {
    title: '🚀 D1 同步到本地',
    description: '將 Cloudflare D1 遠端資料庫同步到本地開發環境',
    usage: '使用方法',
    options: '選項',
    examples: '範例',
    shortAlias: '簡短別名',
    showVersion: '顯示版本',
    showHelp: '顯示說明',
    readingConfig: '正在讀取 wrangler.toml...',
    foundConfig: '找到 wrangler.toml',
    configNotFound: '目前目錄未找到 wrangler.toml',
    noDatabases: 'wrangler.toml 中未找到 D1 資料庫',
    noLocalDb: '未找到本地 D1 資料庫設定',
    localDatabase: '本地資料庫',
    selectSource: '選擇要同步的來源資料庫：',
    binding: '綁定',
    noDbSelected: '未選擇資料庫',
    cancelled: '已取消',
    syncWarning: '將把 {source} 同步到本地資料庫',
    confirmReplace: '所有本地資料將被取代。是否繼續？',
    exportingDb: '正在匯出來源資料庫...',
    exportComplete: '匯出完成',
    cleaningLocal: '正在清理本地資料庫...',
    cleanedLocal: '已清理本地資料庫（{count} 個檔案）',
    processingExport: '正在處理匯出檔案...',
    exportProcessed: '匯出檔案處理完成',
    importingLocal: '正在匯入到本地資料庫...',
    importComplete: '匯入完成',
    syncedTables: '已同步 {count} 個表：',
    records: '筆記錄',
    unableToCount: '無法統計',
    syncSuccess: '✨ 同步成功完成！',
    validationFailed: '驗證失敗：',
    error: '錯誤：'
  },
  ja: {
    title: '🚀 D1 ローカル同期',
    description: 'Cloudflare D1 リモートデータベースをローカル開発環境に同期',
    usage: '使い方',
    options: 'オプション',
    examples: '例',
    shortAlias: '短縮エイリアス',
    showVersion: 'バージョンを表示',
    showHelp: 'ヘルプを表示',
    readingConfig: 'wrangler.toml を読み込み中...',
    foundConfig: 'wrangler.toml が見つかりました',
    configNotFound: '現在のディレクトリに wrangler.toml が見つかりません',
    noDatabases: 'wrangler.toml に D1 データベースが見つかりません',
    noLocalDb: 'ローカル D1 データベース設定が見つかりません',
    localDatabase: 'ローカルデータベース',
    selectSource: '同期元のデータベースを選択してください：',
    binding: 'バインディング',
    noDbSelected: 'データベースが選択されていません',
    cancelled: 'キャンセルされました',
    syncWarning: '{source} をローカルデータベースに同期します',
    confirmReplace: 'すべてのローカルデータが置き換えられます。続行しますか？',
    exportingDb: 'ソースデータベースをエクスポート中...',
    exportComplete: 'エクスポート完了',
    cleaningLocal: 'ローカルデータベースをクリーニング中...',
    cleanedLocal: 'ローカルデータベースをクリーンアップしました（{count} ファイル）',
    processingExport: 'エクスポートファイルを処理中...',
    exportProcessed: 'エクスポートファイルの処理が完了しました',
    importingLocal: 'ローカルデータベースにインポート中...',
    importComplete: 'インポート完了',
    syncedTables: '{count} 個のテーブルを同期しました：',
    records: 'レコード',
    unableToCount: 'カウントできません',
    syncSuccess: '✨ 同期が正常に完了しました！',
    validationFailed: '検証に失敗しました：',
    error: 'エラー：'
  }
};

// Detect system language
function detectLanguage() {
  const env = process.env;
  
  // Allow manual override
  if (env.D1_SYNC_LANG) {
    const lang = env.D1_SYNC_LANG.toLowerCase();
    if (lang === 'zh' || lang === 'zh-cn') return 'zh-CN';
    if (lang === 'zh-tw' || lang === 'tw') return 'zh-TW';
    if (lang === 'ja' || lang === 'jp') return 'ja';
    if (lang === 'en') return 'en';
  }
  
  // Auto-detect from system
  const locale = env.LANG || env.LANGUAGE || env.LC_ALL || env.LC_MESSAGES || '';
  
  if (locale.includes('zh_CN') || locale.includes('zh-CN') || locale.includes('zh.CN')) return 'zh-CN';
  if (locale.includes('zh_TW') || locale.includes('zh-TW') || locale.includes('zh_HK') || locale.includes('zh.TW')) return 'zh-TW';
  if (locale.includes('ja_JP') || locale.includes('ja-JP') || locale.includes('ja.JP')) return 'ja';
  
  return 'en';
}

// Get translated text
function t(key, lang, replacements = {}) {
  const text = locales[lang]?.[key] || locales.en[key] || key;
  
  // Replace placeholders
  return text.replace(/{(\w+)}/g, (match, key) => replacements[key] || match);
}

module.exports = { detectLanguage, t };