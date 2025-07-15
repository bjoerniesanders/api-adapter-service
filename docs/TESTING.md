# Testing Documentation

## Übersicht

Das API Adapter Service Projekt verwendet **Vitest** als Test-Framework mit modernen Testing-Patterns und Test-Cases Arrays für bessere Wartbarkeit.

## Test-Struktur

```
test/
├── setup.ts                 # Globale Test-Konfiguration
├── services/
│   ├── cache.test.ts       # Cache-Service Tests
│   └── retry.test.ts       # Retry-Service Tests
└── integration/
    └── api.test.ts         # API Integration Tests
```

## Test-Cases Pattern

Wir verwenden das **Test-Cases Array Pattern** für bessere Wartbarkeit und Übersichtlichkeit:

```typescript
describe('Service Tests', () => {
  const testCases = [
    {
      name: 'should handle normal case',
      input: 'test',
      expected: 'result',
    },
    {
      name: 'should handle edge case',
      input: '',
      expected: null,
    },
  ];

  testCases.forEach(({ name, input, expected }) => {
    it(name, () => {
      const result = service.method(input);
      expect(result).toBe(expected);
    });
  });
});
```

## Test-Kategorien

### 1. Unit Tests (`test/services/`)

**Cache-Service Tests** (`cache.test.ts`):
- Constructor-Konfiguration
- Set/Get Operationen
- Cache-Strategien (shouldCache)
- Cache-Management (clear, invalidate, invalidateAdapter)
- Statistiken

**Retry-Service Tests** (`retry.test.ts`):
- Constructor-Konfiguration
- Retry-Logik (shouldRetry)
- Backoff-Strategien (calculateRetryDelay)
- Statistiken und Monitoring
- Erfolgs-/Fehler-Aufzeichnung

### 2. Integration Tests (`test/integration/`)

**API Integration Tests** (`api.test.ts`):
- Root-Endpunkte
- Health-Check-Endpunkte
- Adapter-Endpunkte
- Management-Endpunkte
- Cache-Management-Endpunkte
- Retry-Management-Endpunkte
- Dokumentations-Endpunkte

## Test-Konfiguration

### Vitest-Konfiguration (`vitest.config.ts`)

```typescript
export default defineConfig({
  test: {
    globals: true,           // Globale Test-APIs verfügbar
    environment: 'node',     // Node.js-Umgebung
    setupFiles: ['./test/setup.ts'],
    testTimeout: 10000,      // 10 Sekunden für Integration-Tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

### Test-Setup (`test/setup.ts`)

```typescript
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  // Console-Mocks für saubere Test-Ausgabe
});
```

## Test-Scripts

```json
{
  "scripts": {
    "test": "vitest",              // Interaktiver Test-Modus
    "test:run": "vitest run",      // Einmalige Test-Ausführung
    "test:ui": "vitest --ui",      // Vitest UI
    "test:coverage": "vitest run --coverage"  // Mit Coverage-Report
  }
}
```

## Test-Best-Practices

### 1. Test-Cases Arrays verwenden

✅ **Gut:**
```typescript
const testCases = [
  { name: 'should handle success', input: 'valid', expected: true },
  { name: 'should handle failure', input: 'invalid', expected: false },
];

testCases.forEach(({ name, input, expected }) => {
  it(name, () => {
    expect(service.method(input)).toBe(expected);
  });
});
```

❌ **Schlecht:**
```typescript
it('should handle success', () => {
  expect(service.method('valid')).toBe(true);
});

it('should handle failure', () => {
  expect(service.method('invalid')).toBe(false);
});
```

### 2. Aussagekräftige Test-Namen

✅ **Gut:**
```typescript
it('should retry on 500 status code', () => {});
it('should not cache POST requests', () => {});
it('should invalidate all cache entries for an adapter', () => {});
```

❌ **Schlecht:**
```typescript
it('should work', () => {});
it('test 1', () => {});
```

### 3. Test-Isolation

**Unit Tests** - Perfekte Isolation:
```typescript
beforeEach(() => {
  // Jeder Test bekommt eine saubere Instanz
  service = new Service(config);
});
```

**Integration Tests** - Zustand zurücksetzen:
```typescript
beforeEach(async () => {
  // Cache zwischen Tests leeren
  await request(app.server).delete('/api/v1/cache');
  
  // Retry-Statistiken zurücksetzen
  await request(app.server).delete('/api/v1/retry/stats');
});
```

**Vitest-Konfiguration für Isolation:**
```typescript
export default defineConfig({
  test: {
    isolate: true,           // Test-Isolation erzwingen
    pool: 'forks',           // Separate Prozesse für bessere Isolation
    poolOptions: {
      forks: {
        singleFork: true,    // Tests sequenziell ausführen
      },
    },
  },
});
```

### 4. Async-Tests korrekt handhaben

```typescript
it('should handle async operation', async () => {
  const result = await service.asyncMethod();
  expect(result).toBeDefined();
});
```

## Coverage-Ziele

- **Unit Tests**: > 90% Coverage
- **Integration Tests**: > 80% Coverage
- **Gesamt-Coverage**: > 85%

## Debugging Tests

### 1. Einzelne Tests ausführen

```bash
# Spezifischen Test ausführen
npm run test:run -- test/services/cache.test.ts

# Mit Filter
npm run test:run -- -t "should cache GET requests"
```

### 2. Vitest UI verwenden

```bash
npm run test:ui
```

### 3. Debug-Modus

```bash
# Mit Debug-Ausgabe
DEBUG=* npm run test:run
```

## CI/CD Integration

### GitHub Actions Beispiel

```yaml
- name: Run Tests
  run: npm run test:run

- name: Generate Coverage Report
  run: npm run test:coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

## Troubleshooting

### Häufige Probleme

1. **Test Timeouts**: Erhöhe `testTimeout` in `vitest.config.ts`
2. **Cache-Kontamination**: Verwende `beforeEach` für saubere Instanzen
3. **Async-Tests**: Verwende `async/await` korrekt
4. **Mock-Probleme**: Stelle sicher, dass Mocks vor Tests definiert sind

### Performance-Optimierung

1. **Parallele Tests**: Vitest läuft standardmäßig parallel
2. **Test-Gruppierung**: Gruppiere verwandte Tests in `describe`-Blöcken
3. **Setup-Optimierung**: Verwende `beforeAll` für teure Setup-Operationen

## Erweiterte Test-Patterns

### 1. Nested Test-Cases

```typescript
describe('Service', () => {
  const testCases = [
    {
      name: 'success scenarios',
      tests: [
        { input: 'a', expected: 'A' },
        { input: 'b', expected: 'B' },
      ],
    },
    {
      name: 'error scenarios',
      tests: [
        { input: '', expected: null },
        { input: null, expected: null },
      ],
    },
  ];

  testCases.forEach(({ name, tests }) => {
    describe(name, () => {
      tests.forEach(({ input, expected }) => {
        it(`should handle "${input}"`, () => {
          expect(service.method(input)).toBe(expected);
        });
      });
    });
  });
});
```

### 2. Parameterisierte Tests

```typescript
const testMatrix = [
  ['GET', 200, true],
  ['POST', 200, false],
  ['GET', 404, false],
];

testMatrix.forEach(([method, status, expected]) => {
  it(`should cache ${method} ${status} as ${expected}`, () => {
    expect(service.shouldCache(method, status)).toBe(expected);
  });
});
```

## Fazit

Das Test-Cases Array Pattern macht unsere Tests:
- **Wartbarer**: Einfach neue Test-Fälle hinzufügen
- **Lesbarer**: Klare Struktur und Erwartungen
- **Konsistenter**: Einheitliche Test-Struktur
- **Skalierbarer**: Einfach erweiterbar

Die Kombination aus Unit- und Integration-Tests stellt sicher, dass sowohl einzelne Komponenten als auch das gesamte System korrekt funktionieren. 