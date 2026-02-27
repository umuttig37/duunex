
import { CheckCircle, Star, Upload, Zap } from 'lucide-react';

const steps = [
  {
    number: 1,
    title: 'Kerro mitä tarvitset',
    description: 'Kuvaa tehtäväsi yksityiskohtaisesti ja aseta budjetti. Turvallinen alustamme varmistaa saumattoman integraation.',
    icon: <Upload className="h-6 w-6" />,

    color: 'bg-primary/10 text-primary border-primary/20',
  },
  {
    number: 2,
    title: 'Valitse tekijä',
    description: 'Kehittyneet algoritmimme käsittelevät ja analysoivat tietosi automaattisesti, löytäen parhaat tekijät.',
    icon: <Zap className="h-6 w-6" />,
    color: 'bg-primary/10 text-primary border-primary/20',
  },
  {
    number: 3,
    title: 'Saa toimivia tuloksia',
    description: 'Saat selkeitä, toimivia näkemyksiä ja suosituksia tekoälyanalyysin perusteella. Käytä näitä tietoja parantaaksesi liiketoimintastrategioitasi.',
    icon: <Star className="h-6 w-6" />,
    color: 'bg-primary/10 text-primary border-primary/20',
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-block bg-primary/10 text-primary px-3 py-1.5 rounded-md text-xs font-medium mb-4 border border-primary/20">
            NÄIN SE TOIMII
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight mb-2">
            Vain 3 askelta alkuun
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-8">
            {steps.map((step) => (
              <div key={step.number} className="flex items-start gap-5">
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${step.color} flex-shrink-0 border`}>
                  {step.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1.5">
                    {step.number}. {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="relative">
            <div className="bg-muted/50 rounded-lg p-6 border border-border">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="font-medium text-foreground">TaskMVP Dashboard</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 bg-primary rounded-full" />
                  <div className="w-2.5 h-2.5 bg-muted-foreground/40 rounded-full" />
                  <div className="w-2.5 h-2.5 bg-primary/60 rounded-full" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-background rounded-md p-3 border border-border">
                    <div className="text-xl font-semibold text-foreground">24</div>
                    <div className="text-xs text-muted-foreground">Aktiivisia tehtäviä</div>
                  </div>
                  <div className="bg-background rounded-md p-3 border border-border">
                    <div className="text-xl font-semibold text-foreground">€1,240</div>
                    <div className="text-xs text-muted-foreground">Kuukauden tulos</div>
                  </div>
                </div>
                <div className="bg-background rounded-md border border-border">
                  <div className="p-3 border-b border-border">
                    <h4 className="font-medium text-sm text-foreground">Viimeisimmät tehtävät</h4>
                  </div>
                  <div className="divide-y divide-border">
                    {[
                      { name: 'Siivous', status: 'Valmis', amount: '€85' },
                      { name: 'Putkityöt', status: 'Käynnissä', amount: '€150' },
                      { name: 'Muutto', status: 'Odottaa', amount: '€200' },
                    ].map((task, i) => (
                      <div key={i} className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                          <span className="text-sm font-medium text-foreground">{task.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{task.status}</span>
                          <span className="text-sm font-medium text-foreground">{task.amount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -top-3 -right-3 bg-background rounded-md border border-border p-2 shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-foreground">Turvallinen</span>
              </div>
            </div>
            <div className="absolute -bottom-3 -left-3 bg-background rounded-md border border-border p-2 shadow-sm">
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-foreground">Nopea</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
