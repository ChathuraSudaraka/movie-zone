# Movie Zone 🎬

> A modern streaming platform offering seamless movie and TV show experience, built with cutting-edge web technologies.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

## ✨ Features

- **Rich Content Library**: Browse through extensive collection of movies and TV shows
- **Advanced Streaming**: HLS-powered smooth video playback
- **Smart Search**: Quick and efficient content discovery
- **Responsive Design**: Optimized viewing experience across all devices
- **Detailed Info**: Comprehensive details about movies and shows
- **Modern UI**: Sleek interface with Material UI and Headless UI components

## 🛠️ Tech Stack

### Core
- ⚛️ React 18 with TypeScript
- 🎨 Tailwind CSS for styling
- 🔄 Recoil for state management

### Components & Utils
- 📱 React Router DOM for navigation
- 🎥 React Player & HLS.js for video
- 🔌 Axios for API calls

### UI Libraries
- Material UI
- Headless UI
- Hero Icons
- Lucide React Icons

## 💻 Development

### Prerequisites
- Node.js v16+
- npm or yarn

### Quick Start
1. **Clone & Install**
   ```bash
   git clone https://github.com/ChathuraSudaraka/movie-zone.git
   cd movie-zone
   npm install   # or yarn install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Configure your environment variables
   ```

3. **Development Server**
   ```bash
   npm run dev   # or yarn dev
   # Access at http://localhost:5173
   ```

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run linter
npm run preview  # Preview production build
```

## 📂 Project Architecture

```
movie-zone/
├── src/
│   ├── components/   # Reusable UI components
│   ├── hooks/       # Custom React hooks
│   ├── pages/       # Route components
│   ├── services/    # API and external services
│   ├── store/       # Recoil state management
│   ├── types/       # TypeScript definitions
│   ├── utils/       # Helper functions
│   └── main.tsx     # Application entry
├── public/          # Static assets
└── config/          # Configuration files
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

Licensed under the MIT License. See [LICENSE](LICENSE) for more information.

## 🙏 Acknowledgments

- [TMDB API](https://www.themoviedb.org/documentation/api) for movie data
- [React community](https://reactjs.org/community/support.html) for amazing tools and support

---
Made with ❤️ by [Chathura Sudaraka](https://github.com/ChathuraSudaraka)
