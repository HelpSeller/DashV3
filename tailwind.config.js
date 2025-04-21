/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,jsx}"],
    theme: {
      extend: {
        colors: {
          background: '#111827',
          primary: '#3B82F6',
          accent: '#10B981',
          text: '#E5E7EB'
        }
      }
    },
    darkMode: 'class',
    plugins: []
  }
  