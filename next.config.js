/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Supabase Configuration
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    
    // Evolution API Webhook (Hostinger)
    EVOLUTION_WEBHOOK_URL: process.env.EVOLUTION_WEBHOOK_URL,
    
    // Meta Graph API Configuration
    META_GRAPH_API_URL: process.env.META_GRAPH_API_URL || 'https://graph.facebook.com/v18.0',
    META_APP_ID: process.env.META_APP_ID,
    META_APP_SECRET: process.env.META_APP_SECRET,
    
    // LLM Provider (tenant-specific stored in DB)
    DEFAULT_LLM_PROVIDER: process.env.DEFAULT_LLM_PROVIDER || 'openai',
    DEFAULT_LLM_MODEL: process.env.DEFAULT_LLM_MODEL || 'gpt-4-turbo',
    
    // Stripe Configuration (for billing)
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    
    // JWT Secret (for session management)
    JWT_SECRET: process.env.JWT_SECRET || 'change-this-in-production-secure-random-string',
    
    // Vercel Environment Variables (auto-loaded in production)
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
  },

  // Transpile OpenAI and Anthropic packages for serverless
  transpilePackages: ['openai', '@anthropic-ai/sdk'],

  // API routes configuration
  async headers() {
    return [
      {
        source: '/api',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.CORS_ORIGIN || 'https://app.multichat.ai'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,DELETE,OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type,Authorization,X-Webhook-Signature'
          }
        ]
      }
    ];
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },

  // Output directory
  output: 'standalone',
};

module.exports = nextConfig;
