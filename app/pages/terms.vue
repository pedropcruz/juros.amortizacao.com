<script setup lang="ts">
const lastUpdate = new Date().toLocaleDateString('pt-PT', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})

useHead({
  title: 'Termos de Serviço - Juros',
  meta: [
    { name: 'description', content: 'Termos de Serviço do Juros. Leia as condições de utilização da nossa plataforma de simulação de crédito.' }
  ]
})
</script>

<template>
  <UContainer class="py-12">
    <div class="max-w-3xl mx-auto space-y-8">
      <div class="text-center space-y-4">
        <h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          Termos de Serviço
        </h1>
        <p class="text-lg text-gray-500 dark:text-gray-400">
          Última atualização: {{ lastUpdate }}
        </p>
      </div>

      <UCard>
        <div class="prose dark:prose-invert max-w-none space-y-8">
          <section>
            <h3>1. Aceitação dos Termos</h3>
            <p>
              Ao aceder e utilizar a plataforma <strong>Juros</strong> ("Serviço"), disponibilizada via web, concorda em cumprir estes Termos de Serviço, todas as leis e regulamentos aplicáveis, e concorda que é responsável pelo cumprimento de todas as leis locais aplicáveis. Se não concordar com algum destes termos, está proibido de usar ou aceder a este site.
            </p>
          </section>

          <section>
            <h3>2. Descrição do Serviço e Isenção de Responsabilidade</h3>
            <p>
              O Juros é uma ferramenta de literacia financeira destinada a auxiliar os utilizadores na simulação de cenários de Crédito Habitação.
            </p>
            <p><strong>IMPORTANTE:</strong></p>
            <ul>
              <li><strong>Não Aconselhamento Financeiro:</strong> O conteúdo e as ferramentas fornecidas pelo Juros são apenas para fins informativos e educacionais. Não constituem aconselhamento financeiro, jurídico ou fiscal profissional.</li>
              <li><strong>Estimativas:</strong> Os resultados das simulações são estimativas baseadas nos dados fornecidos pelo utilizador e em fórmulas matemáticas padrão. Podem existir discrepâncias em relação aos valores reais praticados pelas instituições bancárias devido a diferentes métodos de cálculo (ex: dias do mês, arredondamentos).</li>
              <li><strong>Confirmação:</strong> Deve sempre consultar o seu banco ou um intermediário de crédito qualificado antes de tomar qualquer decisão financeira.</li>
            </ul>
          </section>

          <section>
            <h3>3. Registo e Conta de Utilizador</h3>
            <p>
              Para aceder a certas funcionalidades, poderá ser necessário criar uma conta. Compromete-se a:
            </p>
            <ul>
              <li>Fornecer informações verdadeiras, exatas, atuais e completas.</li>
              <li>Manter a confidencialidade da sua password e conta.</li>
              <li>Notificar-nos imediatamente de qualquer uso não autorizado da sua conta.</li>
            </ul>
            <p>
              Reservamo-nos o direito de suspender ou encerrar a sua conta se violar estes Termos.
            </p>
          </section>

          <section>
            <h3>4. Assinaturas e Pagamentos</h3>
            <p>
              Algumas funcionalidades do Serviço podem estar disponíveis apenas através de compra ou subscrição ("Versão Pro").
            </p>
            <ul>
              <li><strong>Processador de Pagamento:</strong> Os nossos pagamentos são processados pela <strong>Lemon Squeezy</strong>, que atua como "Merchant of Record". Ao efetuar uma compra, estará também sujeito aos Termos de Serviço da Lemon Squeezy.</li>
              <li><strong>Reembolsos:</strong> A nossa política de reembolso segue as diretrizes da Lemon Squeezy e a legislação aplicável de defesa do consumidor.</li>
              <li><strong>Acesso Vitalício (Lifetime Deal):</strong> Se adquirir um plano vitalício, o acesso é garantido enquanto o Serviço estiver operacional.</li>
            </ul>
          </section>

          <section>
            <h3>5. Propriedade Intelectual</h3>
            <p>
              O Serviço e o seu conteúdo original, características e funcionalidades são e permanecerão propriedade exclusiva do Juros e dos seus licenciadores. O Serviço está protegido por direitos de autor e outras leis de propriedade intelectual.
            </p>
          </section>

          <section>
            <h3>6. Links para Outros Sites</h3>
            <p>
              O nosso Serviço pode conter links para sites de terceiros que não são controlados por nós. Não assumimos qualquer responsabilidade pelo conteúdo, políticas de privacidade ou práticas de quaisquer sites ou serviços de terceiros.
            </p>
          </section>

          <section>
            <h3>7. Limitação de Responsabilidade</h3>
            <p>
              Em caso algum o Juros, os seus diretores, funcionários, parceiros ou fornecedores serão responsáveis por quaisquer danos indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo, sem limitação, perda de lucros, dados, uso, boa vontade ou outras perdas intangíveis, resultantes do seu acesso, uso ou incapacidade de aceder ou usar o Serviço.
            </p>
          </section>

          <section>
            <h3>8. Alterações aos Termos</h3>
            <p>
              Reservamo-nos o direito de modificar ou substituir estes Termos a qualquer momento. Se uma revisão for material, tentaremos fornecer um aviso com pelo menos 30 dias de antecedência antes de quaisquer novos termos entrarem em vigor.
            </p>
          </section>

          <section>
            <h3>9. Lei Aplicável</h3>
            <p>
              Estes Termos serão regidos e interpretados de acordo com as leis de Portugal e da União Europeia, sem levar em conta as disposições sobre conflitos de leis.
            </p>
          </section>

          <section>
            <h3>10. Contacto</h3>
            <p>
              Se tiver alguma dúvida sobre estes Termos, contacte-nos através dos canais de suporte disponíveis na plataforma.
            </p>
          </section>
        </div>
      </UCard>
    </div>
  </UContainer>
</template>
