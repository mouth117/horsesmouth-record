async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'https://www.horsesmouthapp.com/api/:path*',
    },
  ];
}
