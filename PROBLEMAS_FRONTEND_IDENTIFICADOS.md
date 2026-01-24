# 🔍 Problemas Identificados no Frontend

## 📋 Resumo
Análise das chamadas de API do frontend e identificação de problemas.

---

## ✅ VERIFICAÇÃO GERAL

**Todas as rotas chamadas pelo frontend existem no backend!**

Não há rotas incorretas ou endpoints que não existem.

---

## ⚠️ PROBLEMAS ESPECÍFICOS IDENTIFICADOS

### 1. 🕐 PONTO ELETRÔNICO (TimeClock.tsx)

#### Problema
O frontend está enviando campos que o backend não aceita no INSERT:

**Arquivo**: `pages/TimeClock.tsx` (linha 123-134)

```typescript
const newLog: Partial<TimeLog> = {
    id: `tl-man-${Date.now()}`,
    userId: user.id,
    entityName: user.name,  // ❌ Campo não existe na tabela
    clinicId: user.clinicId, // ❌ Campo não existe na tabela
    date: manualDate,
    clockIn: start,
    clockOut: end,
    type: 'MANUAL',
    status: 'PENDING',
    justification
};
```

#### Solução
O backend já ignora esses campos, mas é melhor remover do frontend para evitar confusão:

```typescript
const newLog: Partial<TimeLog> = {
    id: `tl-man-${Date.now()}`,
    userId: user.id,
    // Remover entityName e clinicId (não existem na tabela)
    date: manualDate,
    clockIn: start,
    clockOut: end,
    type: 'MANUAL',
    status: 'PENDING',
    justification
};
```

**Status**: ⚠️ **Não crítico** (backend ignora, mas pode causar confusão)

---

### 2. 👨‍⚕️ TERAPEUTAS NÃO APARECEM NO CADASTRO DE PACIENTES

#### Problema
Os terapeutas são filtrados de `users`, mas podem não estar sendo carregados corretamente.

**Arquivo**: `pages/PatientsList.tsx` (linha 38)

```typescript
const therapists = users.filter(u => u.role === 'THERAPIST' || u.role === 'SPECIALIST');
```

#### Possíveis Causas

1. **`users` não está sendo carregado**
   - Verificar se `DataContext` está carregando `users` corretamente
   - Verificar se `clinicId` está sendo passado corretamente

2. **Filtro por `clinicId` está muito restritivo**
   - Verificar se os terapeutas têm `clinicId` correto
   - Verificar se o filtro no backend está funcionando

3. **`users` está vazio ou não foi carregado ainda**
   - Verificar se `isLoading` está sendo tratado
   - Verificar se há erro no carregamento

#### Verificação Necessária

```typescript
// Adicionar debug em PatientsList.tsx
console.log('Users carregados:', users);
console.log('Terapeutas filtrados:', therapists);
console.log('ClinicId do usuário:', user?.clinicId);
```

**Status**: 🔴 **CRÍTICO** (funcionalidade não funciona)

---

### 3. 💬 MENSAGEM "JÁ CADASTRADO"

#### Problema
Usuário vê mensagem "já cadastrado" mesmo sem salvar.

#### Possíveis Causas

1. **Validação de email único no backend**
   - Backend pode estar retornando erro de email duplicado
   - Frontend pode não estar tratando o erro corretamente

2. **Validação no frontend antes de salvar**
   - Pode estar verificando se já existe antes de criar
   - Pode estar mostrando mensagem errada

3. **Cache ou estado antigo**
   - Dados podem estar em cache
   - Estado pode não estar sendo limpo

#### Verificação Necessária

1. Verificar logs do backend quando tenta salvar
2. Verificar se há validação de email único
3. Verificar tratamento de erros no frontend

**Status**: 🟡 **MÉDIO** (afeta UX)

---

## 🧪 TESTES NECESSÁRIOS

### 1. Testar Ponto Eletrônico
```bash
# No VPS, verificar logs do backend ao criar time log
docker-compose logs -f backend | grep -i "timelog"
```

### 2. Testar Carregamento de Terapeutas
```javascript
// Adicionar no console do navegador
console.log('Users:', window.users);
console.log('Therapists:', window.users?.filter(u => u.role === 'THERAPIST'));
```

### 3. Testar Mensagem "Já Cadastrado"
- Tentar criar paciente/usuário novo
- Verificar resposta do backend
- Verificar logs do backend

---

## 🔧 CORREÇÕES RECOMENDADAS

### Prioridade 1: Terapeutas não aparecem
1. Verificar se `users` está sendo carregado em `DataContext`
2. Verificar se filtro por `clinicId` está correto
3. Adicionar loading state e tratamento de erro

### Prioridade 2: Mensagem "Já Cadastrado"
1. Verificar validação de email único no backend
2. Melhorar tratamento de erros no frontend
3. Adicionar mensagens de erro mais claras

### Prioridade 3: Ponto Eletrônico
1. Remover campos `clinicId` e `entityName` do frontend
2. Verificar se backend está funcionando corretamente

---

## 📝 PRÓXIMOS PASSOS

1. ✅ Executar `testar_apis_frontend.sh` no VPS
2. ✅ Verificar logs do backend durante uso
3. ✅ Adicionar debug nos componentes problemáticos
4. ✅ Corrigir problemas identificados
5. ✅ Testar novamente
