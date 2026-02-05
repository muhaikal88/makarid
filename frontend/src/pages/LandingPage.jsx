import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { 
  Building2, 
  Users, 
  FileCheck, 
  BarChart3, 
  Clock, 
  Shield, 
  Zap, 
  Globe, 
  Check,
  ArrowRight,
  ChevronRight
} from 'lucide-react';

const translations = {
  id: {
    hero: {
      title: "Sistem HR Modern untuk Bisnis Indonesia",
      subtitle: "Platform manajemen HR all-in-one yang membantu perusahaan Anda mengelola rekrutmen, karyawan, dan operasional HR dengan lebih efisien.",
      cta: "Mulai Sekarang",
      demo: "Lihat Demo"
    },
    features: {
      title: "Fitur Unggulan",
      subtitle: "Semua yang Anda butuhkan untuk mengelola HR perusahaan dalam satu platform",
      items: [
        {
          icon: "users",
          title: "Manajemen Multi-Tenant",
          description: "Kelola multiple perusahaan dari satu dashboard Super Admin dengan isolasi data yang aman"
        },
        {
          icon: "building",
          title: "White-Label Domain",
          description: "Setiap klien dapat menggunakan domain custom mereka sendiri untuk branding yang konsisten"
        },
        {
          icon: "filecheck",
          title: "Sistem Rekrutmen Lengkap",
          description: "Career page, custom application forms, dan tracking aplikasi yang terintegrasi"
        },
        {
          icon: "barchart",
          title: "Dashboard Analytics",
          description: "Statistik real-time dan insights untuk pengambilan keputusan yang lebih baik"
        },
        {
          icon: "shield",
          title: "Keamanan Tingkat Enterprise",
          description: "JWT authentication, role-based access control, dan enkripsi data end-to-end"
        },
        {
          icon: "globe",
          title: "Bilingual Support",
          description: "Interface dalam Bahasa Indonesia dan English untuk jangkauan yang lebih luas"
        }
      ]
    },
    benefits: {
      title: "Mengapa Memilih Kami",
      items: [
        "Setup cepat dalam hitungan menit",
        "Interface yang user-friendly dan intuitif",
        "Support 24/7 dari tim ahli",
        "Skalabilitas untuk bisnis dari segala ukuran",
        "Regular updates dan fitur baru",
        "Data security dan compliance"
      ]
    },
    pricing: {
      title: "Paket Harga yang Fleksibel",
      subtitle: "Pilih paket yang sesuai dengan kebutuhan bisnis Anda",
      trial: {
        name: "Trial",
        price: "Gratis",
        duration: "30 hari",
        features: [
          "Akses semua fitur dasar",
          "Hingga 10 karyawan",
          "1 job posting aktif",
          "Email support"
        ],
        cta: "Mulai Trial"
      },
      monthly: {
        name: "Bulanan",
        price: "Rp 500.000",
        duration: "per bulan",
        features: [
          "Semua fitur Trial",
          "Unlimited karyawan",
          "Unlimited job postings",
          "Custom domain",
          "Priority support"
        ],
        cta: "Pilih Bulanan"
      },
      yearly: {
        name: "Tahunan",
        price: "Rp 5.000.000",
        duration: "per tahun",
        badge: "Hemat 17%",
        features: [
          "Semua fitur Bulanan",
          "Diskon 17%",
          "Dedicated account manager",
          "Custom integrations",
          "SLA guarantee"
        ],
        cta: "Pilih Tahunan"
      }
    },
    cta: {
      title: "Siap Transformasi HR Anda?",
      subtitle: "Bergabunglah dengan ratusan perusahaan yang telah mempercayai platform kami",
      button: "Mulai Sekarang - Gratis 30 Hari"
    },
    footer: {
      copyright: "© 2026 Makar.id - All rights reserved",
      builtWith: "Built with"
    }
  },
  en: {
    hero: {
      title: "Modern HR System for Indonesian Business",
      subtitle: "All-in-one HR management platform that helps your company manage recruitment, employees, and HR operations more efficiently.",
      cta: "Get Started",
      demo: "View Demo"
    },
    features: {
      title: "Key Features",
      subtitle: "Everything you need to manage company HR in one platform",
      items: [
        {
          icon: "users",
          title: "Multi-Tenant Management",
          description: "Manage multiple companies from one Super Admin dashboard with secure data isolation"
        },
        {
          icon: "building",
          title: "White-Label Domain",
          description: "Each client can use their own custom domain for consistent branding"
        },
        {
          icon: "filecheck",
          title: "Complete Recruitment System",
          description: "Career pages, custom application forms, and integrated application tracking"
        },
        {
          icon: "barchart",
          title: "Analytics Dashboard",
          description: "Real-time statistics and insights for better decision making"
        },
        {
          icon: "shield",
          title: "Enterprise-Level Security",
          description: "JWT authentication, role-based access control, and end-to-end data encryption"
        },
        {
          icon: "globe",
          title: "Bilingual Support",
          description: "Interface in Indonesian and English for wider reach"
        }
      ]
    },
    benefits: {
      title: "Why Choose Us",
      items: [
        "Quick setup in minutes",
        "User-friendly and intuitive interface",
        "24/7 support from expert team",
        "Scalability for businesses of all sizes",
        "Regular updates and new features",
        "Data security and compliance"
      ]
    },
    pricing: {
      title: "Flexible Pricing Plans",
      subtitle: "Choose the plan that fits your business needs",
      trial: {
        name: "Trial",
        price: "Free",
        duration: "30 days",
        features: [
          "Access all basic features",
          "Up to 10 employees",
          "1 active job posting",
          "Email support"
        ],
        cta: "Start Trial"
      },
      monthly: {
        name: "Monthly",
        price: "$35",
        duration: "per month",
        features: [
          "All Trial features",
          "Unlimited employees",
          "Unlimited job postings",
          "Custom domain",
          "Priority support"
        ],
        cta: "Choose Monthly"
      },
      yearly: {
        name: "Yearly",
        price: "$350",
        duration: "per year",
        badge: "Save 17%",
        features: [
          "All Monthly features",
          "17% discount",
          "Dedicated account manager",
          "Custom integrations",
          "SLA guarantee"
        ],
        cta: "Choose Yearly"
      }
    },
    cta: {
      title: "Ready to Transform Your HR?",
      subtitle: "Join hundreds of companies that trust our platform",
      button: "Get Started - Free for 30 Days"
    },
    footer: {
      copyright: "© 2026 Makar.id - All rights reserved",
      builtWith: "Built with"
    }
  }
};

const iconMap = {
  users: Users,
  building: Building2,
  filecheck: FileCheck,
  barchart: BarChart3,
  clock: Clock,
  shield: Shield,
  zap: Zap,
  globe: Globe
};

export const LandingPage = () => {
  const { t: tFunc, language } = useLanguage();
  const t = translations[language];

  const IconComponent = ({ name }) => {
    const Icon = iconMap[name] || Users;
    return <Icon className="w-6 h-6" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header/Nav */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-8 h-8 text-[#2E4DA7]" />
            <span className="text-xl font-bold text-gray-900">Makar.id</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.location.href = '/company-login'}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {language === 'id' ? 'Masuk' : 'Login'}
            </button>
            <Button
              onClick={() => window.location.href = '/company-login'}
              className="bg-[#2E4DA7] hover:bg-[#2E4DA7]/90"
            >
              {t.hero.cta}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-28">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            {t.hero.title}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            {t.hero.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={() => window.location.href = '/company-login'}
              className="bg-[#2E4DA7] hover:bg-[#2E4DA7]/90 text-base px-8"
            >
              {t.hero.cta}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => window.location.href = '/company-login'}
              className="text-base px-8"
            >
              {t.hero.demo}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-[#2E4DA7]">500+</div>
              <div className="text-sm text-gray-600 mt-1">{language === 'id' ? 'Perusahaan' : 'Companies'}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#2E4DA7]">10K+</div>
              <div className="text-sm text-gray-600 mt-1">{language === 'id' ? 'Karyawan' : 'Employees'}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#2E4DA7]">99.9%</div>
              <div className="text-sm text-gray-600 mt-1">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-slate-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t.features.title}
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              {t.features.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {t.features.items.map((feature, idx) => (
              <Card key={idx} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-[#2E4DA7]/10 rounded-lg flex items-center justify-center mb-4">
                    <IconComponent name={feature.icon} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12 text-center">
              {t.benefits.title}
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {t.benefits.items.map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-slate-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t.pricing.title}
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              {t.pricing.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Trial Plan */}
            <Card className="border-2 border-gray-200">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t.pricing.trial.name}
                </h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{t.pricing.trial.price}</span>
                  <span className="text-gray-600 ml-2">{t.pricing.trial.duration}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {t.pricing.trial.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => window.location.href = '/company-login'}
                >
                  {t.pricing.trial.cta}
                </Button>
              </CardContent>
            </Card>

            {/* Monthly Plan */}
            <Card className="border-2 border-[#2E4DA7] relative shadow-lg">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-[#2E4DA7] text-white text-xs font-semibold px-4 py-1.5 rounded-full">
                  {language === 'id' ? 'Populer' : 'Popular'}
                </span>
              </div>
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t.pricing.monthly.name}
                </h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{t.pricing.monthly.price}</span>
                  <span className="text-gray-600 ml-2">{t.pricing.monthly.duration}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {t.pricing.monthly.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full bg-[#2E4DA7] hover:bg-[#2E4DA7]/90"
                  onClick={() => window.location.href = '/company-login'}
                >
                  {t.pricing.monthly.cta}
                </Button>
              </CardContent>
            </Card>

            {/* Yearly Plan */}
            <Card className="border-2 border-gray-200">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900">
                    {t.pricing.yearly.name}
                  </h3>
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-1 rounded">
                    {t.pricing.yearly.badge}
                  </span>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{t.pricing.yearly.price}</span>
                  <span className="text-gray-600 ml-2">{t.pricing.yearly.duration}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {t.pricing.yearly.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => window.location.href = '/company-login'}
                >
                  {t.pricing.yearly.cta}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-[#2E4DA7] to-[#1E3A8A] rounded-2xl p-12 text-white">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t.cta.title}
            </h2>
            <p className="text-base sm:text-lg text-blue-100 mb-8">
              {t.cta.subtitle}
            </p>
            <Button
              size="lg"
              onClick={() => window.location.href = '/company-login'}
              className="bg-white text-[#2E4DA7] hover:bg-gray-100"
            >
              {t.cta.button}
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-slate-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-[#2E4DA7]" />
              <span className="font-semibold text-gray-900">Makar.id</span>
            </div>
            <div className="text-sm text-gray-600">
              {t.footer.copyright}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{t.footer.builtWith}</span>
              <span className="text-red-500">❤</span>
              <span>Emergent</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
