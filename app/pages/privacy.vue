<script setup lang="ts">
const lastUpdate = new Date().toLocaleDateString('pt-PT', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})

useHead({
  title: 'Política de Privacidade - Juros',
  meta: [
    { name: 'description', content: 'Política de Privacidade do Juros. Saiba como recolhemos, usamos e protegemos os seus dados pessoais.' }
  ]
})
</script>

<template>
  <UContainer class="py-12">
    <div class="max-w-3xl mx-auto space-y-8">
      <div class="text-center space-y-4">
        <h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          Política de Privacidade
        </h1>
        <p class="text-lg text-gray-500 dark:text-gray-400">
          Última atualização: {{ lastUpdate }}
        </p>
      </div>

      <UCard>
        <div class="prose dark:prose-invert max-w-none space-y-8">
          <section>
            <h3>1. Introdução</h3>
            <p>
              O <strong>Juros</strong> ("nós", "nosso") valoriza a privacidade dos seus utilizadores. Esta Política de Privacidade descreve como recolhemos, usamos, armazenamos e partilhamos os seus dados pessoais ao utilizar a nossa plataforma de simulação e gestão de crédito habitação.
            </p>
            <p>
              Ao utilizar o nosso serviço, concorda com a recolha e uso de informações de acordo com esta política. Estamos em conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD).
            </p>
          </section>

          <section>
            <h3>2. Responsável pelo Tratamento de Dados</h3>
            <p>
              O responsável pelo tratamento dos seus dados pessoais é a equipa de desenvolvimento do Juros. Para quaisquer questões relacionadas com a privacidade, por favor contacte-nos através do email:
              <a
                href="mailto:suporte@juros.amortizacao.com"
                class="text-primary-600 dark:text-primary-400 hover:underline"
              >suporte@juros.amortizacao.com</a>.
            </p>
          </section>

          <section>
            <h3>3. Dados que Recolhemos</h3>
            <p>Recolhemos diferentes tipos de informação para fornecer e melhorar o nosso serviço:</p>
            <ul>
              <li>
                <strong>Informações de Conta:</strong> Ao registar-se, recolhemos o seu nome, endereço de email e, no caso de login social (Google), a sua foto de perfil.
              </li>
              <li>
                <strong>Dados de Simulação:</strong> Armazenamos os dados financeiros que insere nas simulações (montantes, taxas, prazos, seguros) para permitir a persistência e consulta futura dos seus cenários.
              </li>
              <li>
                <strong>Dados de Utilização:</strong> Recolhemos informações sobre como acede e utiliza o serviço, incluindo o seu endereço IP, tipo de browser, páginas visitadas e carimbos de data/hora.
              </li>
              <li>
                <strong>Dados de Pagamento:</strong> O processamento de pagamentos é gerido pelo nosso parceiro <strong>Lemon Squeezy</strong>. Não armazenamos os seus dados de cartão de crédito nos nossos servidores.
              </li>
            </ul>
          </section>

          <section>
            <h3>4. Finalidade do Tratamento</h3>
            <p>Utilizamos os seus dados para:</p>
            <ul>
              <li>Fornecer, operar e manter a nossa plataforma;</li>
              <li>Melhorar, personalizar e expandir o nosso serviço;</li>
              <li>Compreender e analisar como utiliza a nossa plataforma;</li>
              <li>Desenvolver novos produtos, serviços, características e funcionalidades;</li>
              <li>Comunicar consigo, incluindo para serviço ao cliente, atualizações e informações relacionadas com o serviço;</li>
              <li>Processar as suas transações e gerir a sua subscrição;</li>
              <li>Prevenir fraudes e garantir a segurança da plataforma.</li>
            </ul>
          </section>

          <section>
            <h3>5. Partilha de Dados com Terceiros</h3>
            <p>
              Não vendemos os seus dados pessoais. Partilhamos informações apenas com prestadores de serviços terceiros essenciais para a operação da plataforma, sujeitos a obrigações de confidencialidade:
            </p>
            <ul>
              <li><strong>Lemon Squeezy:</strong> Processamento de pagamentos e gestão fiscal.</li>
              <li><strong>Resend:</strong> Envio de emails transacionais (recuperação de password, validação de conta).</li>
              <li><strong>PostHog:</strong> Análise de utilização (apenas dados anonimizados ou pseudonimizados).</li>
              <li><strong>Neon/PostgreSQL:</strong> Infraestrutura de base de dados.</li>
            </ul>
          </section>

          <section>
            <h3>6. Segurança dos Dados</h3>
            <p>
              A segurança dos seus dados é importante para nós. Implementamos medidas de segurança técnicas e organizacionais adequadas, incluindo encriptação em trânsito (HTTPS) e em repouso na base de dados, para proteger as suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição.
            </p>
          </section>

          <section>
            <h3>7. Retenção de Dados</h3>
            <p>
              Reteremos os seus dados pessoais apenas durante o tempo necessário para as finalidades estabelecidas nesta Política de Privacidade. Reteremos e utilizaremos os seus dados na medida do necessário para cumprir as nossas obrigações legais, resolver disputas e fazer cumprir os nossos acordos e políticas legais.
            </p>
          </section>

          <section>
            <h3>8. Os Seus Direitos (RGPD)</h3>
            <p>Se reside no Espaço Económico Europeu (EEE), tem certos direitos de proteção de dados:</p>
            <ul>
              <li>Direito de acesso, atualização ou eliminação das informações que temos sobre si.</li>
              <li>Direito de retificação.</li>
              <li>Direito de oposição.</li>
              <li>Direito de restrição.</li>
              <li>Direito à portabilidade dos dados.</li>
              <li>Direito de retirar o consentimento.</li>
            </ul>
            <p>
              Pode exercer a maioria destes direitos diretamente nas definições da sua conta. Para outros pedidos, contacte-nos.
            </p>
          </section>

          <section>
            <h3>9. Cookies e Tecnologias Semelhantes</h3>
            <p>
              Utilizamos cookies e tecnologias de rastreio semelhantes para rastrear a atividade no nosso serviço e armazenar certas informações (como a sua sessão de autenticação). Pode instruir o seu browser para recusar todos os cookies ou indicar quando um cookie está a ser enviado.
            </p>
          </section>

          <section>
            <h3>10. Alterações a Esta Política</h3>
            <p>
              Podemos atualizar a nossa Política de Privacidade periodicamente. Notificá-lo-emos de quaisquer alterações publicando a nova Política de Privacidade nesta página e atualizando a data de "Última atualização". Aconselhamo-lo a rever esta política periodicamente.
            </p>
          </section>
        </div>
      </UCard>
    </div>
  </UContainer>
</template>
