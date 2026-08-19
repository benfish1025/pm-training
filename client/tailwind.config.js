/** @type {import('tailwindcss').Config} */
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default {
  content: [
    resolve(__dirname, 'index.html'),
    resolve(__dirname, 'src/**/*.{js,ts,jsx,tsx}'),
  ],
  theme: {
    extend: {
      colors: {
        // ArcoDesign arcoblue 主色系
        arcoblue: {
          1: '#E8F3FF',
          2: '#BEDAFF',
          3: '#94BFFF',
          4: '#6AA1FF',
          5: '#4080FF',
          6: '#165DFF', // 主色
          7: '#0E42D2',
          8: '#072CA6',
          9: '#031A79',
          10: '#000D4D',
        },
        // ArcoDesign 中性灰 (gray)
        arco: {
          1: '#F7F8FA',
          2: '#F2F3F5',
          3: '#E5E6EB',
          4: '#C9CDD4',
          5: '#A9AEB8',
          6: '#86909C',
          7: '#6B7785',
          8: '#4E5969',
          9: '#272E3B',
          10: '#1D2129',
        },
        // ArcoDesign green (成功色)
        arcogreen: {
          1: '#E8FFEA',
          2: '#AFF0B5',
          6: '#00B42A',
        },
      },
      borderRadius: {
        'arco-sm': '2px',
        'arco': '4px',
        'arco-lg': '8px',
      },
      fontFamily: {
        arco: ['nunito_for_arco', 'Helvetica Neue', 'Helvetica', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', 'Arial', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
