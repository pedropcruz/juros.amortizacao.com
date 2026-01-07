<script setup lang="ts">
const { isAuthenticated } = useAuth()
const config = useRuntimeConfig()
const checkoutUrl = config.public.lemonSqueezyCheckoutUrl || '#'

const features = [
  {
    icon: 'i-lucide-calculator',
    title: 'Simulação Precisa',
    description: 'Cálculos baseados no Sistema Francês usado pelos bancos portugueses, incluindo Imposto do Selo e seguros.'
  },
  {
    icon: 'i-lucide-piggy-bank',
    title: 'Amortização Antecipada',
    description: 'Descubra quanto poupa ao amortizar. Escolha entre reduzir a prestação ou o prazo do empréstimo.'
  },
  {
    icon: 'i-lucide-line-chart',
    title: 'Visualização Clara',
    description: 'Gráficos intuitivos que mostram a evolução da sua dívida e a composição de cada prestação.'
  },
  {
    icon: 'i-lucide-shield-check',
    title: 'Dados Privados',
    description: 'Os seus dados ficam consigo. Sem publicidade, sem venda de informação a terceiros.'
  },
  {
    icon: 'i-lucide-bell',
    title: 'Alertas Euribor',
    description: 'Receba notificações quando a Euribor mudar e veja o impacto na sua prestação. (Em breve)'
  },
  {
    icon: 'i-lucide-folder',
    title: 'Guardar Simulações',
    description: 'Guarde múltiplas simulações para comparar cenários e acompanhar a evolução do seu crédito.'
  }
]
</script>

<template>
  <div class="bg-white dark:bg-gray-950">
    <!-- Hero Section -->
    <div class="relative overflow-hidden">
      <!-- Background Pattern -->
      <div class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-[size:16px_16px] opacity-25 dark:opacity-10" />
      <div class="absolute inset-0 bg-gradient-to-b from-primary-50/50 via-transparent to-white dark:from-primary-950/20 dark:to-gray-950" />

      <div class="relative max-w-7xl mx-auto px-4 pt-20 pb-24 sm:pt-32 sm:pb-32 sm:px-6 lg:px-8">
        <div class="text-center max-w-4xl mx-auto">
          <!-- Badge -->
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 rounded-full text-primary-700 dark:text-primary-300 text-sm font-medium mb-8">
            <UIcon
              name="i-lucide-sparkles"
              class="w-4 h-4"
            />
            100% Gratuito - Sem publicidade
          </div>

          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6">
            Domine o seu
            <span class="text-primary-600 dark:text-primary-400">Crédito Habitação</span>
          </h1>

          <p class="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
            Simule a sua prestação, descubra quanto pode poupar com amortizações antecipadas
            e tome decisões financeiras informadas.
          </p>

          <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <UButton
              to="/simulator"
              size="xl"
              class="font-bold shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all px-8"
              icon="i-lucide-calculator"
            >
              Simular Agora
            </UButton>
            <UButton
              v-if="!isAuthenticated"
              to="/register"
              size="xl"
              variant="outline"
              color="neutral"
              class="px-8"
              icon="i-lucide-user-plus"
            >
              Criar Conta Grátis
            </UButton>
            <UButton
              v-else
              to="/dashboard"
              size="xl"
              variant="outline"
              color="neutral"
              class="px-8"
              icon="i-lucide-layout-dashboard"
            >
              Ir para Dashboard
            </UButton>
          </div>
        </div>

        <!-- Hero Stats -->
        <div class="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
          <div class="text-center">
            <div class="text-3xl font-bold text-gray-900 dark:text-white">
              4%
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              Imposto do Selo incluído
            </div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-gray-900 dark:text-white">
              360
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              Meses de detalhe
            </div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-gray-900 dark:text-white">
              0.5%
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              Comissão amortização
            </div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-gray-900 dark:text-white">
              100%
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              Privado e seguro
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div class="py-24 bg-gray-50 dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Tudo o que precisa para gerir o seu crédito
          </h2>
          <p class="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Ferramentas profissionais de simulação financeira, calibradas para a realidade portuguesa.
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="group bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
          >
            <div class="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UIcon
                :name="feature.icon"
                class="w-6 h-6 text-primary-600 dark:text-primary-400"
              />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {{ feature.title }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              {{ feature.description }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- How It Works Section -->
    <div class="py-24">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Como funciona
          </h2>
          <p class="text-gray-600 dark:text-gray-400">
            Três passos simples para dominar o seu crédito
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <div class="text-center">
            <div class="w-16 h-16 bg-primary-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Introduza os dados
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              Montante, Euribor, Spread e prazo do seu empréstimo
            </p>
          </div>

          <div class="text-center">
            <div class="w-16 h-16 bg-primary-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Veja os resultados
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              Prestação mensal, juros totais e tabela de amortização completa
            </p>
          </div>

          <div class="text-center">
            <div class="w-16 h-16 bg-primary-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Simule poupanças
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              Descubra quanto poupa com amortizações antecipadas
            </p>
          </div>
        </div>

        <div class="text-center mt-12">
          <UButton
            to="/simulator"
            size="xl"
            icon="i-lucide-arrow-right"
            trailing
          >
            Começar Simulação
          </UButton>
        </div>
      </div>
    </div>

    <!-- Pricing Section -->
    <div class="py-24 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800" id="pricing">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Investimento Inteligente
          </h2>
          <p class="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Uma pequena decisão hoje pode poupar-lhe milhares de euros no futuro.
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <!-- Free Plan -->
          <div class="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col hover:border-primary-200 transition-colors">
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Gratuito</h3>
            <p class="text-gray-500 dark:text-gray-400 mb-6">Para validação rápida.</p>
            <div class="text-4xl font-bold text-gray-900 dark:text-white mb-8">0€</div>
            
            <ul class="space-y-4 flex-1 mb-8">
              <li class="flex items-start gap-3">
                <UIcon name="i-lucide-check" class="w-5 h-5 text-green-500 shrink-0" />
                <span class="text-gray-600 dark:text-gray-300">Simulador Avançado</span>
              </li>
              <li class="flex items-start gap-3">
                <UIcon name="i-lucide-check" class="w-5 h-5 text-green-500 shrink-0" />
                <span class="text-gray-600 dark:text-gray-300">Guardar até 3 simulações</span>
              </li>
              <li class="flex items-start gap-3">
                <UIcon name="i-lucide-check" class="w-5 h-5 text-green-500 shrink-0" />
                <span class="text-gray-600 dark:text-gray-300">Exportar PDF Simples</span>
              </li>
            </ul>

            <UButton
              to="/register"
              color="neutral"
              variant="soft"
              block
              size="lg"
            >
              Começar Grátis
            </UButton>
          </div>

          <!-- Pro Plan -->
          <div class="relative bg-white dark:bg-gray-800 rounded-3xl p-8 border-2 border-primary-500 shadow-xl flex flex-col scale-105">
            <div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
              Oferta de Lançamento
            </div>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pro Vitalício</h3>
            <p class="text-gray-500 dark:text-gray-400 mb-6">Para poupança máxima.</p>
            <div class="flex items-baseline gap-2 mb-8">
                <span class="text-4xl font-bold text-gray-900 dark:text-white">19€</span>
                <span class="text-gray-400 line-through text-lg">49€</span>
                <span class="text-gray-500 text-sm">pagamento único</span>
            </div>
            
            <ul class="space-y-4 flex-1 mb-8">
              <li class="flex items-start gap-3">
                <UIcon name="i-lucide-check" class="w-5 h-5 text-primary-500 shrink-0" />
                <span class="text-gray-900 dark:text-white font-medium">Comparador de Cenários</span>
              </li>
              <li class="flex items-start gap-3">
                <UIcon name="i-lucide-check" class="w-5 h-5 text-primary-500 shrink-0" />
                <span class="text-gray-900 dark:text-white font-medium">Simulações Ilimitadas</span>
              </li>
              <li class="flex items-start gap-3">
                <UIcon name="i-lucide-check" class="w-5 h-5 text-primary-500 shrink-0" />
                <span class="text-gray-900 dark:text-white font-medium">PDF White-label (Para Consultores)</span>
              </li>
              <li class="flex items-start gap-3">
                <UIcon name="i-lucide-check" class="w-5 h-5 text-primary-500 shrink-0" />
                <span class="text-gray-900 dark:text-white font-medium">Acesso a atualizações futuras</span>
              </li>
            </ul>

            <UButton
              :to="checkoutUrl"
              target="_blank"
              color="primary"
              variant="solid"
              block
              size="lg"
              class="font-bold"
            >
              Comprar Acesso Vitalício
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA Section -->
    <div class="py-24 bg-primary-600 dark:bg-primary-900">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl font-bold text-white mb-4">
          Pronto para tomar controlo das suas finanças?
        </h2>
        <p class="text-primary-100 mb-8 text-lg">
          Crie uma conta gratuita e guarde as suas simulações para acompanhar a evolução do seu crédito.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <UButton
            v-if="!isAuthenticated"
            to="/register"
            size="xl"
            color="neutral"
            variant="solid"
            class="font-bold px-8"
          >
            Criar Conta Grátis
          </UButton>
          <UButton
            to="/simulator"
            size="xl"
            variant="outline"
            class="text-white border-white hover:bg-white/10 px-8"
          >
            Experimentar Primeiro
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
