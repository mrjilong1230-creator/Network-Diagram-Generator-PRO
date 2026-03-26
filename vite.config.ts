import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [
    vue(),
    viteSingleFile()
  ],
  build: {
    outDir: 'docs' // 🌟 新增这一行：告诉引擎打包到 docs 文件夹
  }
})