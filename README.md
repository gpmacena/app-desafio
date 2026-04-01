# FitChallenge — Casal em tempo real

App de desafios e treino para dois usuários, com placar **Versus** e sincronização em tempo real via Firebase.

---

## Passo 1 — Criar o repositório no GitHub

1. Acesse [github.com](https://github.com) e faça login
2. Clique em **New repository**
3. Nome: `fitchallenge`
4. Deixe como **Public**
5. Clique em **Create repository**
6. Clique em **uploading an existing file** e suba o `index.html`
7. Clique em **Commit changes**

---

## Passo 2 — Ativar GitHub Pages

1. No repositório → **Settings** → **Pages**
2. Em Source: `Deploy from a branch`
3. Branch: `main`, pasta: `/ (root)`
4. **Save**
5. Em ~2 minutos o app estará em: `https://SEU_USUARIO.github.io/fitchallenge`

---

## Passo 3 — Criar projeto no Firebase (gratuito)

O Firebase é necessário para os dois usarem o mesmo banco de dados em tempo real.

### 3.1 Criar o projeto
1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **Adicionar projeto**
3. Nome: `fitchallenge` → **Continuar**
4. Desative Google Analytics (não precisa) → **Criar projeto**

### 3.2 Criar o Realtime Database
1. No menu lateral, clique em **Realtime Database**
2. Clique em **Criar banco de dados**
3. Escolha a localização mais próxima (ex: `us-central1`)
4. Em modo de segurança, escolha **Iniciar no modo de teste**
5. Clique em **Ativar**

### 3.3 Pegar as credenciais
1. No menu lateral, clique na engrenagem ⚙️ → **Configurações do projeto**
2. Role até **Seus aplicativos** → clique em `</>` (Web)
3. Nome do app: `fitchallenge` → **Registrar aplicativo**
4. Você verá um objeto `firebaseConfig` assim:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "fitchallenge-xxxxx.firebaseapp.com",
  databaseURL: "https://fitchallenge-xxxxx-default-rtdb.firebaseio.com",
  projectId: "fitchallenge-xxxxx",
  ...
};
```

5. Copie os valores de `apiKey`, `authDomain`, `databaseURL` e `projectId`

### 3.4 Configurar as regras de segurança
1. No Realtime Database → aba **Regras**
2. Substitua o conteúdo por:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
3. Clique em **Publicar**

> ⚠️ Essas regras são abertas para facilitar. O banco só tem dados de treino, sem dados sensíveis.

---

## Passo 4 — Configurar o app

1. Abra `https://SEU_USUARIO.github.io/fitchallenge` no navegador
2. O app vai mostrar a tela de configuração automaticamente
3. Preencha os nomes e cole os dados do Firebase
4. Clique em **Salvar e continuar**
5. Pronto! Mande o link para sua esposa e ela configura no celular dela com os mesmos dados do Firebase

---

## Como funciona

| Campo | Você | Esposa |
|-------|------|--------|
| Água | 3L/dia | 2L/dia |
| Corrida | 3x/semana | — |
| Academia | 4x/semana | — |
| Zero fast food | ✓ | ✓ |
| 10k passos | ✓ | ✓ |

- Cada um entra com seu nome
- Os dados são salvos no Firebase em tempo real
- A aba **Versus** mostra o placar ao vivo
- Um ponto verde aparece quando o outro está online

---

## Estrutura do projeto

```
fitchallenge/
└── index.html   ← app completo (tudo em um arquivo)
```
