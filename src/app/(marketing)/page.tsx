import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Your AI-Powered
              <span className="text-primary block">Wardrobe Assistant</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Organize your wardrobe, get outfit suggestions, and keep your shoes in perfect condition.
              Let AI help you look your best every day.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/sign-up">
                <Button size="lg" className="text-lg px-8">
                  Start Free
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* App Preview */}
      <section className="py-12 bg-muted/30">
        <div className="container">
          <div className="max-w-5xl mx-auto">
            <AppPreview />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need to Manage Your Wardrobe
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <FeatureCard
              icon={<WardrobeIcon />}
              title="Digital Wardrobe"
              description="Photograph and catalog every item you own. Filter by category, color, season, and formality."
            />
            <FeatureCard
              icon={<OutfitIcon />}
              title="AI Outfit Suggestions"
              description="Get personalized outfit recommendations based on the occasion, weather, and your style preferences."
            />
            <FeatureCard
              icon={<ShoeCareIcon />}
              title="Shoe Care Tracking"
              description="Never forget to polish your shoes. Track care schedules and get reminders for maintenance."
            />
            <FeatureCard
              icon={<ChatIcon />}
              title="Ask Claude"
              description="Chat with AI about your wardrobe. Get styling advice, color coordination tips, and more."
            />
            <FeatureCard
              icon={<CalendarIcon />}
              title="Wear Tracking"
              description="See which items you wear most and which are gathering dust. Make smarter wardrobe decisions."
            />
            <FeatureCard
              icon={<TagIcon />}
              title="Smart Organization"
              description="Tag items with custom attributes. Find exactly what you need with powerful filters."
            />
          </div>
        </div>
      </section>

      {/* Screenshot Previews */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-4">
            See It In Action
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            A clean, intuitive interface designed to make wardrobe management effortless.
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <ScreenshotCard
              title="Wardrobe Grid"
              description="Browse all your items at a glance with our visual grid layout."
            >
              <MockWardrobeGrid />
            </ScreenshotCard>
            <ScreenshotCard
              title="Outfit Builder"
              description="Mix and match items to create the perfect outfit."
            >
              <MockOutfitBuilder />
            </ScreenshotCard>
            <ScreenshotCard
              title="AI Chat"
              description="Get instant styling advice from our AI assistant."
            >
              <MockChat />
            </ScreenshotCard>
            <ScreenshotCard
              title="Shoe Care Dashboard"
              description="Track polish schedules and care supplies."
            >
              <MockShoeCare />
            </ScreenshotCard>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Upgrade Your Wardrobe Game?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of style-conscious people who use Outfit IQ to look their best.
            </p>
            <Link href="/sign-up">
              <Button size="lg" className="text-lg px-8">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-lg border bg-card">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function ScreenshotCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="aspect-[4/3] bg-muted/50 p-4">{children}</div>
      <div className="p-4 border-t">
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

// Mock UI Components for Screenshots
function AppPreview() {
  return (
    <div className="rounded-xl border bg-card shadow-2xl overflow-hidden">
      {/* Mock browser chrome */}
      <div className="h-8 bg-muted border-b flex items-center px-3 gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="px-4 py-1 bg-background rounded text-xs text-muted-foreground">
            outfit-iq.com
          </div>
        </div>
      </div>
      {/* Mock app */}
      <div className="flex h-[400px]">
        {/* Sidebar */}
        <div className="w-48 border-r bg-background p-4 hidden sm:block">
          <div className="font-semibold mb-4">Outfit IQ</div>
          <div className="space-y-2">
            <div className="px-3 py-2 rounded bg-primary/10 text-primary text-sm">Wardrobe</div>
            <div className="px-3 py-2 text-sm text-muted-foreground">Outfits</div>
            <div className="px-3 py-2 text-sm text-muted-foreground">Shoe Care</div>
            <div className="px-3 py-2 text-sm text-muted-foreground">Ask Claude</div>
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 p-4 bg-background">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="font-semibold">My Wardrobe</div>
              <div className="text-xs text-muted-foreground">24 items</div>
            </div>
            <div className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm">Add Item</div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square rounded bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MockWardrobeGrid() {
  const colors = ["bg-blue-200", "bg-gray-200", "bg-amber-100", "bg-slate-700", "bg-white", "bg-rose-100"];
  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-2 mb-3">
        <div className="px-2 py-1 bg-primary/10 rounded text-xs">All</div>
        <div className="px-2 py-1 bg-muted rounded text-xs">Tops</div>
        <div className="px-2 py-1 bg-muted rounded text-xs">Pants</div>
        <div className="px-2 py-1 bg-muted rounded text-xs">Shoes</div>
      </div>
      <div className="grid grid-cols-4 gap-2 flex-1">
        {colors.map((color, i) => (
          <div key={i} className={`rounded ${color} border`} />
        ))}
      </div>
    </div>
  );
}

function MockOutfitBuilder() {
  return (
    <div className="h-full flex gap-3">
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex-1 rounded bg-blue-100 border flex items-center justify-center text-xs text-muted-foreground">
          Shirt
        </div>
        <div className="flex-1 rounded bg-slate-700 border flex items-center justify-center text-xs text-white">
          Pants
        </div>
        <div className="h-16 rounded bg-amber-800 border flex items-center justify-center text-xs text-white">
          Shoes
        </div>
      </div>
      <div className="w-24 space-y-2">
        <div className="text-xs font-medium">Occasion</div>
        <div className="px-2 py-1 bg-muted rounded text-xs">Business</div>
        <div className="text-xs font-medium mt-3">Weather</div>
        <div className="px-2 py-1 bg-muted rounded text-xs">Mild</div>
      </div>
    </div>
  );
}

function MockChat() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-full bg-muted shrink-0" />
          <div className="px-3 py-2 bg-muted rounded-lg text-xs max-w-[80%]">
            What should I wear to a business dinner?
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <div className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs max-w-[80%]">
            I&apos;d suggest your navy blazer with the light blue shirt and charcoal trousers...
          </div>
        </div>
      </div>
      <div className="mt-2 flex gap-2">
        <div className="flex-1 px-3 py-2 bg-muted rounded text-xs text-muted-foreground">
          Ask about your wardrobe...
        </div>
      </div>
    </div>
  );
}

function MockShoeCare() {
  return (
    <div className="h-full flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium">Due for care</div>
        <div className="text-xs text-primary">View all</div>
      </div>
      <div className="space-y-2 flex-1">
        <div className="flex items-center gap-2 p-2 bg-muted rounded">
          <div className="w-10 h-10 rounded bg-amber-800" />
          <div className="flex-1">
            <div className="text-xs font-medium">Oxford Brogues</div>
            <div className="text-xs text-orange-500">Due today</div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 bg-muted rounded">
          <div className="w-10 h-10 rounded bg-black" />
          <div className="flex-1">
            <div className="text-xs font-medium">Chelsea Boots</div>
            <div className="text-xs text-muted-foreground">Due in 3 days</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icons
function WardrobeIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function OutfitIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.39m3.421 3.415a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.764m3.42 3.415a6.776 6.776 0 00-3.42-3.415" />
    </svg>
  );
}

function ShoeCareIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
  );
}
