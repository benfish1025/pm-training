/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Coze 设计规范（浅色）
        coz: {
          // 应用底色 / 奶油米灰
          cream: '#f7f7f5',
          // 文本层级
          text1: '#09090b',
          text2: '#3f3f46',
          text3: '#a1a1aa',
          text5: '#808087',
          // 卡片与边框
          card: '#ffffff',
          border: '#e7e5e4',
          // 交互色
          hover: 'rgba(10,10,10,0.05)',
          // 气泡
          'bubble-ai': '#EBEFEB',
          'bubble-user': 'rgba(10,10,10,0.05)',
          // 品牌紫
          primary: '#412bff',
          'primary-hover': '#3722d9',
        },
      },
      borderRadius: {
        // Coze 卡片与输入框大圆角
        'coz-card': '12px',
        'coz-xl': '20px',
      },
      boxShadow: {
        // 输入卡片阴影
        'coz-input': '0 4px 12px 0 rgba(134,145,161,0.08)',
      },
      fontFamily: {
        coz: ['-apple-system', 'BlinkMacSystemFont', '"PingFang SC"', '"Microsoft YaHei"', 'Arial', 'sans-serif'],
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
