# Roteiros de viagem

App web para consultar os roteiros no telemóvel, alojada no GitHub Pages, com dados na Supabase (projeto `app-viagens`).

## Publicar no GitHub Pages
1. Em github.com, cria um repositório novo (ex.: `viagens`). Pode ser privado se tiveres GitHub Pro; no plano gratuito, o Pages exige repositório público (os dados continuam protegidos pela password, porque estão na Supabase e não no código).
2. "Add file" → "Upload files" e arrasta **todo o conteúdo desta pasta** (incluindo `.github` e `.nojekyll`). Confirma com "Commit changes".
3. Settings → Pages → em "Branch" escolhe `main` e a pasta `/ (root)` → Save.
4. Ao fim de 1–2 minutos, a app fica em `https://<o-teu-utilizador>.github.io/viagens/`.

## Configurar a Supabase (uma vez)
No painel da Supabase, projeto **app-viagens** → Authentication → URL Configuration:
- **Site URL**: o endereço do GitHub Pages acima.
- **Redirect URLs**: acrescenta o mesmo endereço.

## Primeiro acesso
1. Abre a app, escreve o teu email e uma password, e toca em "Primeiro acesso? Criar conta".
2. Confirma o email que recebes e entra. Ficas como dono da viagem da Benelux.
3. Depois de criares a conta, em Authentication → Sign In / Providers, desliga "Allow new users to sign up". Os convidados continuam a entrar pelos convites.

## Convidar os outros
Na app: Mais → Participantes → Convidar. Cada pessoa recebe um email para definir a password e só consulta.

## Manter a Supabase ativa
A tarefa em `.github/workflows/manter-ativo.yml` dá um sinal de vida de 3 em 3 dias. Em Actions, confirma que está ativa (no primeiro uso o GitHub pode pedir para a ativar).
