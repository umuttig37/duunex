
import { CheckCircle, Star, Upload, Zap } from 'lucide-react';

const steps = [
  {
    number: 1,
    title: 'Kerro mitä tarvitset',
    description: 'Kuvaa tehtäväsi yksityiskohtaisesti ja aseta budjetti. Turvallinen alustamme varmistaa saumattoman integraation.',
    icon: <Upload className="h-6 w-6" />,

    color: 'bg-green-50 text-green-600 border-green-200',
  },
  {
    number: 2,
    title: 'Valitse tekijä',
    description: 'Kehittyneet algoritmimme käsittelevät ja analysoivat tietosi automaattisesti, löytäen parhaat tekijät.',
    icon: <Zap className="h-6 w-6" />,
  color: 'bg-green-50 text-green-600 border-green-200',
  },
  {
    number: 3,
    title: 'Saa toimivia tuloksia',
    description: 'Saat selkeitä, toimivia näkemyksiä ja suosituksia tekoälyanalyysin perusteella. Käytä näitä tietoja parantaaksesi liiketoimintastrategioitasi.',
    icon: <Star className="h-6 w-6" />,
  color: 'bg-green-50 text-green-600 border-green-200',
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block bg-green-50 text-green-600 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-green-200">
            NÄIN SE TOIMII
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Vain 3 askelta alkuun
          </h2>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Steps Section */}
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-start gap-6">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${step.color} flex-shrink-0 border`}>
                  {step.icon}
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {step.number}. {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Dashboard Preview */}
          <div className="relative">
            <div className="bg-gray-50 rounded-2xl p-8 shadow-xl border border-gray-200">
              {/* Mock Dashboard Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900">TaskMVP Dashboard</span>
                </div>
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
              </div>

              {/* Mock Dashboard Content */}
              <div className="space-y-4">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-2xl font-bold text-gray-900">24</div>
                    <div className="text-sm text-gray-600">Aktiivisia tehtäviä</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-2xl font-bold text-gray-900">€1,240</div>
                    <div className="text-sm text-gray-600">Kuukauden tulos</div>
                  </div>
                </div>

                {/* Task List */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h4 className="font-medium text-gray-900">Viimeisimmät tehtävät</h4>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {[
                      { name: 'Siivous', status: 'Valmis', amount: '€85' },
                      { name: 'Putkityöt', status: 'Käynnissä', amount: '€150' },
                      { name: 'Muutto', status: 'Odottaa', amount: '€200' },
                    ].map((task, i) => (
                      <div key={i} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium text-gray-900">{task.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500">{task.status}</span>
                          <span className="text-sm font-medium text-gray-900">{task.amount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium text-gray-900">Turvallinen</span>
              </div>
            </div>
            
            <div className="absolute -bottom-4 -left-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-xs font-medium text-gray-900">Nopea</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
