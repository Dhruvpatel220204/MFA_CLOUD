import { Shield, Lock, Smartphone, Activity, CheckCircle, Zap, Users, Eye, ArrowRight, Server, Globe, FileCheck, Key, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";

const Welcome = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Lock,
      title: "Password Encryption",
      description: "Military-grade encryption with bcrypt for maximum security",
    },
    {
      icon: Smartphone,
      title: "Multi-Factor Auth",
      description: "OTP verification via email or SMS for enhanced protection",
    },
    {
      icon: Activity,
      title: "Real-Time Monitoring",
      description: "Track login attempts and security events in real-time",
    },
    {
      icon: Shield,
      title: "Role-Based Access",
      description: "Granular permission control for different user roles",
    },
  ];

  const benefits = [
    { icon: CheckCircle, text: "Zero-trust architecture" },
    { icon: Zap, text: "Lightning-fast authentication" },
    { icon: Users, text: "Unlimited user accounts" },
    { icon: Eye, text: "Complete audit trail" },
    { icon: Server, text: "99.99% uptime guarantee" },
    { icon: Globe, text: "Global CDN distribution" },
  ];

  const howItWorks = [
    { step: "01", title: "Register Your Account", description: "Create an account with your email and set a strong password" },
    { step: "02", title: "Enable Multi-Factor Auth", description: "Set up OTP verification for additional security layers" },
    { step: "03", title: "Configure Security", description: "Set up security questions and access policies" },
    { step: "04", title: "Start Securing", description: "Begin protecting your applications with enterprise-grade security" },
  ];

  const advancedCapabilities = [
    { icon: Key, title: "Advanced Key Management", description: "Secure key generation and rotation policies" },
    { icon: Server, title: "Cloud Infrastructure", description: "Scalable and resilient cloud-based architecture" },
    { icon: Users, title: "Team Collaboration", description: "Manage multiple users with admin controls" },
    { icon: Eye, title: "Audit Logging", description: "Complete security event tracking and reporting" },
    { icon: Fingerprint, title: "Biometric Ready", description: "Support for advanced authentication methods" },
    { icon: Globe, title: "Global CDN", description: "Worldwide infrastructure for fast response times" },
  ];

  const useCases = [
    { icon: Shield, title: "Enterprise Apps", description: "Secure your business applications with enterprise-grade authentication" },
    { icon: Server, title: "Cloud Services", description: "Protect cloud-based services with multi-layer security" },
    { icon: FileCheck, title: "Data Platforms", description: "Ensure compliance and data protection standards" },
  ];

  const faqs = [
    { 
      question: "How secure is the authentication system?", 
      answer: "We use military-grade encryption, multi-factor authentication, and follow industry best practices including OWASP security guidelines." 
    },
    { 
      question: "Can I integrate this with my existing application?", 
      answer: "Yes! Our system provides REST APIs and SDKs for seamless integration with any application or platform." 
    },
    { 
      question: "What happens if I lose access to my MFA device?", 
      answer: "We provide recovery options including backup codes and security questions to ensure you never lose access to your account." 
    },
    { 
      question: "Is there a limit on the number of users?", 
      answer: "No limits! Our system scales automatically to handle any number of users, from startups to enterprise-level applications." 
    },
  ];

  return (
    <div className="min-h-screen gradient-hero">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary shadow-glow mb-6">
            <Shield className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Multi-Factor Cloud Authentication
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Enterprise-grade security system with multiple layers of protection for your cloud applications
          </p>
        </header>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="p-6 shadow-elegant hover:shadow-glow transition-smooth hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl gradient-accent mb-4">
                <feature.icon className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: "400ms" }}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="gradient-primary shadow-elegant hover:shadow-glow transition-smooth text-lg px-8"
              onClick={() => navigate("/register")}
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 border-2 hover:border-primary transition-smooth"
              onClick={() => navigate("/login")}
            >
              Sign In
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Secure authentication in less than 2 minutes
          </p>
        </div>

        {/* Stats */}
        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Success Rate", value: "99.9%" },
            { label: "Response Time", value: "<100ms" },
            { label: "Security Layers", value: "5+" },
            { label: "Uptime", value: "99.99%" },
          ].map((stat, index) => (
            <Card key={index} className="p-6 text-center shadow-elegant">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-foreground">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* How It Works */}
        <div className="mt-32">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-primary">How It Works</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Get started in four simple steps
          </p>
          <div className="grid md:grid-cols-4 gap-6">
            {howItWorks.map((item, index) => (
              <Card key={index} className="p-6 shadow-elegant hover:shadow-glow transition-smooth relative">
                <div className="flex flex-col h-full">
                  <div className="text-6xl font-bold text-primary/20 mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  {index < howItWorks.length - 1 && (
                    <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-primary" size={24} />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Advanced Security Capabilities */}
        <div className="mt-32">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-primary">Advanced Security Capabilities</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Comprehensive security tools for modern applications
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {advancedCapabilities.map((capability, index) => (
              <Card key={index} className="p-6 shadow-elegant hover:shadow-glow transition-smooth">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <capability.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{capability.title}</h3>
                <p className="text-sm text-muted-foreground">{capability.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Security Benefits */}
        <div className="mt-32">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Built for Security</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Comprehensive security features that protect your data and users
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card
                key={index}
                className="p-6 flex items-center gap-4 shadow-elegant hover:shadow-glow transition-smooth"
              >
                <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-5 h-5 text-accent-foreground" />
                </div>
                <span className="font-medium">{benefit.text}</span>
              </Card>
            ))}
          </div>
        </div>

        {/* Use Cases */}
        <div className="mt-32">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Perfect For Any Application</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Trusted by teams building mission-critical applications
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <Card key={index} className="p-8 shadow-elegant hover:shadow-glow transition-smooth">
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-4">
                  <useCase.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{useCase.title}</h3>
                <p className="text-muted-foreground">{useCase.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-32 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Frequently Asked Questions</h2>
          <p className="text-center text-muted-foreground mb-12">
            Everything you need to know about our authentication system
          </p>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Final CTA */}
        <div className="mt-32 text-center">
          <Card className="p-12 shadow-elegant gradient-primary">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Secure Your Application?
            </h2>
            <p className="text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Join thousands of developers who trust our authentication system
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8 shadow-elegant hover:shadow-glow"
              onClick={() => navigate("/register")}
            >
              Get Started Now
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
