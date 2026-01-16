<script setup lang="ts">
const plans = [
  {
    name: 'Gratuito',
    description: 'Perfeito para simulações rápidas e pontuais.',
    price: '0€',
    period: '/mês',
    features: [
      'Máximo de 3 simulações',
      'Cálculo de Prestação Mensal',
      'Análise de Taxa de Esforço',
      'Gráficos básicos',
      'Sem publicidade'
    ],
    buttonText: 'Começar Agora',
    buttonTo: '/simulator',
    buttonVariant: 'outline',
    buttonColor: 'neutral',
    highlight: false
  },
  {
    name: 'Pro',
    description: 'Para quem quer dominar o seu crédito e poupar milhares.',
    price: '19€',
    period: '/único',
    features: [
      'Tudo no plano Gratuito',
      'Simulações Ilimitadas',
      'Guardar simulações na Cloud',
      'Comparação de Cenários lado-a-lado',
      'Gráficos de Amortização Avançados',
      'Exportar Relatórios PDF',
      'Acesso Vitalício (Lifetime Deal)'
    ],
    buttonText: 'Obter Acesso Pro',
    buttonTo: '/register',
    buttonVariant: 'solid',
    buttonColor: 'primary',
    highlight: true,
    badge: 'Mais Popular'
  },
  {
    name: 'Institucional',
    description: 'Para intermediários de crédito e consultores.',
    price: 'Sob Consulta',
    period: '',
    features: [
      'Múltiplas contas de utilizador',
      'Gestão de clientes',
      'Relatórios White-label (Seu Logo)',
      'API de Simulação',
      'Suporte Dedicado',
      'Faturação Empresarial'
    ],
    buttonText: 'Contactar Vendas',
    buttonTo: 'mailto:suporte@juros.amortizacao.com',
    buttonVariant: 'outline',
    buttonColor: 'neutral',
    highlight: false
  }
]
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-3xl mx-auto mb-16">
      <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl mb-4">
        Escolha o plano ideal para as suas necessidades
      </h2>
      <p class="text-lg text-gray-500 dark:text-gray-400">
        Comece gratuitamente ou desbloqueie ferramentas profissionais para acelerar a amortização do seu crédito.
      </p>
    </div>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-8">
      <div
        v-for="plan in plans"
        :key="plan.name"
        class="relative flex flex-col p-8 rounded-2xl ring-1 ring-gray-200 dark:ring-gray-800 transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/10"
        :class="[
          plan.highlight
            ? 'bg-primary-50/50 dark:bg-primary-900/10 ring-2 ring-primary-500 dark:ring-primary-500 shadow-xl shadow-primary-500/20 scale-105 z-10'
            : 'bg-white dark:bg-gray-900 hover:ring-primary-500 dark:hover:ring-primary-500'
        ]"
      >
        <!-- Popular Badge -->
        <div
          v-if="plan.highlight"
          class="absolute -top-4 inset-x-0 flex justify-center"
        >
          <UBadge
            color="primary"
            variant="solid"
            class="px-4 py-1 rounded-full text-sm font-semibold uppercase tracking-wide"
          >
            {{ plan.badge }}
          </UBadge>
        </div>

        <!-- Header -->
        <div class="mb-6">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">
            {{ plan.name }}
          </h3>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400 min-h-[40px]">
            {{ plan.description }}
          </p>
        </div>

        <!-- Price -->
        <div class="mb-6 flex items-baseline gap-1">
          <span class="text-4xl font-extrabold text-gray-900 dark:text-white">{{ plan.price }}</span>
          <span class="text-gray-500 dark:text-gray-400 font-medium">{{ plan.period }}</span>
        </div>

        <!-- Divider -->
        <div class="flex items-center py-4">
          <div class="flex-1 border-t border-gray-200 dark:border-gray-700" />
          <span class="px-3 text-sm text-gray-500 dark:text-gray-400">
            O que está incluído?
          </span>
          <div class="flex-1 border-t border-gray-200 dark:border-gray-700" />
        </div>

        <!-- Features -->
        <ul class="flex-1 space-y-4 mb-8">
          <li
            v-for="feature in plan.features"
            :key="feature"
            class="flex items-start gap-3"
          >
            <UIcon
              name="i-lucide-check-circle"
              class="w-5 h-5 text-primary-500 shrink-0 mt-0.5"
            />
            <span class="text-sm text-gray-600 dark:text-gray-300">{{ feature }}</span>
          </li>
        </ul>

        <!-- Action -->
        <UButton
          :to="plan.buttonTo"
          :variant="plan.buttonVariant as any"
          :color="plan.buttonColor as any"
          block
          size="lg"
          class="mt-auto"
        >
          {{ plan.buttonText }}
        </UButton>
      </div>
    </div>
  </div>
</template>
