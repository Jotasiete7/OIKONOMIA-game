// tools/test_facility_inspectors_e2e.cjs
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const VITE_PORT = 5179;

const viteProcess = spawn('npx.cmd', ['vite', '--port', String(VITE_PORT), '--strictPort'], {
  cwd: path.resolve(__dirname, '..'),
  shell: true,
  stdio: 'pipe'
});

let viteOut = '';
viteProcess.stdout.on('data', (d) => viteOut += d.toString());
viteProcess.stderr.on('data', (d) => viteOut += d.toString());

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForVite() {
  for (let i = 0; i < 30; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get('http://localhost:' + VITE_PORT + '/', (res) => {
          if (res.statusCode === 200) resolve();
          else reject(new Error('Status ' + res.statusCode));
        });
        req.on('error', reject);
      });
      console.log('✓ Servidor Vite ativo na porta', VITE_PORT);
      return;
    } catch (e) {
      await sleep(300);
    }
  }
  throw new Error('Timeout aguardando Vite iniciar');
}

async function run() {
  let edgeProc = null;
  let exitCode = 0;

  try {
    await waitForVite();

    const edgePaths = [
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    const edgeBin = edgePaths.find(p => fs.existsSync(p));
    if (!edgeBin) {
      throw new Error('Navegador Edge não encontrado no sistema.');
    }

    const debugPort = 9224;
    const tempProfile = path.resolve(__dirname, '../.edge_temp_profile_inspectors');
    if (!fs.existsSync(tempProfile)) fs.mkdirSync(tempProfile, { recursive: true });

    edgeProc = spawn(edgeBin, [
      '--remote-debugging-port=' + debugPort,
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--user-data-dir=' + tempProfile,
      'http://localhost:' + VITE_PORT + '/'
    ]);

    await sleep(2000);

    const targets = await new Promise((resolve, reject) => {
      http.get('http://127.0.0.1:' + debugPort + '/json', res => {
        let raw = '';
        res.on('data', c => raw += c);
        res.on('end', () => resolve(JSON.parse(raw)));
      }).on('error', reject);
    });

    const pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
      throw new Error('Página do jogo não encontrada no CDP: ' + JSON.stringify(targets));
    }

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    function sendCdp(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        const handler = (evt) => {
          const res = JSON.parse(evt.data);
          if (res.id === id) {
            ws.removeEventListener('message', handler);
            if (res.error) reject(res.error);
            else if (res.result && res.result.exceptionDetails) {
              const ex = res.result.exceptionDetails;
              const desc = ex.exception ? ex.exception.description : (ex.text || JSON.stringify(ex));
              reject(new Error('CDP JS Exception: ' + desc));
            }
            else resolve(res.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await sendCdp('Runtime.enable');
    await sendCdp('Page.enable');

    console.log('✓ Conectado ao CDP da engine.');
    await sleep(1500);

    console.log('\n--- Teste 1: Exposição Global dos Métodos ---');
    const checkGlobals = await sendCdp('Runtime.evaluate', {
      expression: `
        (() => {
          const fns = [
            'renderIdlePanel', 'renderEmptyLotPanel', 'renderFacilityPanel',
            'renderMinePanel', 'renderFarmPanel', 'renderFactoryPanel', 'setFactoryFacade',
            'renderStorePanel', 'renderRDCenterPanel', 'toggleRDPatentsExpanded',
            'showCustomConfirmModal', 'closeCustomConfirmModal', 'executeCustomConfirmModal',
            'checkWorkingCapitalSafety', 'confirmBuildRDCenter',
            'openInsolvencyModal', 'closeInsolvencyModal', 'showBankruptcyModal',
            'syncDREValues', 'openFacilityDREModal', 'closeFacilityDREModal', 'renderFacilityDRETable'
          ];
          const missing = fns.filter(f => typeof window[f] !== 'function');
          return { ok: missing.length === 0, missing };
        })()
      `,
      returnByValue: true
    });
    console.log('Resultado Teste 1:', checkGlobals.result.value);
    if (!checkGlobals.result.value.ok) {
      throw new Error('Funções ausentes no window: ' + checkGlobals.result.value.missing.join(', '));
    }

    console.log('\n--- Teste 2: Inspeção de Lote Vazio ---');
    const testEmptyLot = await sendCdp('Runtime.evaluate', {
      expression: `
        (() => {
          const mockTile = { x: 50, y: 50, district: { name: 'Centro Financeiro', landRentDaily: 25 }, city: { cityName: 'Nova Atenas' } };
          window.FacilityPanel.renderEmptyLotPanel(mockTile);
          const title = document.getElementById('facility-title')?.textContent;
          const badge = document.getElementById('facility-rent-badge')?.textContent;
          return { title, badge, ok: title?.includes('50, 50') && badge?.includes('25') };
        })()
      `,
      returnByValue: true
    });
    console.log('Resultado Teste 2:', testEmptyLot.result.value);
    if (!testEmptyLot.result.value.ok) {
      throw new Error('Falha ao renderizar lote vazio: ' + JSON.stringify(testEmptyLot.result.value));
    }

    console.log('\n--- Teste 3: Inspeção de Loja de Varejo ---');
    const testStore = await sendCdp('Runtime.evaluate', {
      expression: `
        (() => {
          const mockStoreTile = {
            x: 51, y: 51,
            district: { name: 'Comércio Central', landRentDaily: 30, population: 50000, trafficIndex: 70 },
            store: {
              name: 'Supermercado Central',
              storeTypeId: 'supermarket',
              maxShelves: 4,
              shelves: {
                bread: { price: 2.50, quality: 60, stock: 250, maxCapacity: 500, dailyRestock: 50, landedCost: 1.20, supplierName: 'Porto Alpha' }
              }
            }
          };
          window.FacilityPanel.renderStorePanel(mockStoreTile);
          const title = document.getElementById('facility-title')?.textContent;
          const content = document.getElementById('facility-content-panel')?.innerHTML;
          const hasBread = content?.includes('Pão') || content?.includes('bread');
          const hasSimBtn = content?.includes('Simular');
          return { title, hasBread, hasSimBtn, ok: title === 'Supermercado Central' && hasBread && hasSimBtn };
        })()
      `,
      returnByValue: true
    });
    console.log('Resultado Teste 3:', testStore.result.value);
    if (!testStore.result.value.ok) {
      throw new Error('Falha ao renderizar painel de loja: ' + JSON.stringify(testStore.result.value));
    }

    console.log('\n--- Teste 4: Inspeção de Fábrica & Seleção de Fachada ---');
    const testFactory = await sendCdp('Runtime.evaluate', {
      expression: `
        (() => {
          const mockFactoryTile = {
            x: 52, y: 52,
            district: { name: 'Polo Industrial', landRentDaily: 20 },
            factory: {
              name: 'Complexo Siderúrgico',
              customSkin: 'auto',
              maxLines: 4,
              lines: {
                line_1: {
                  recipeId: 'steel',
                  recipeName: 'Laminação de Aço',
                  outputProductId: 'steel',
                  outputQuality: 70,
                  unitCost: 15.00,
                  dailyCapacity: 100,
                  finishedStock: 400
                }
              }
            }
          };
          window.FacilityPanel.renderFactoryPanel(mockFactoryTile);
          const title = document.getElementById('facility-title')?.textContent;
          const hasRecipe = document.getElementById('facility-content-panel')?.textContent?.includes('Laminação de Aço');
          
          if (!window.worldGrid) window.worldGrid = {};
          if (!window.worldGrid[52]) window.worldGrid[52] = {};
          window.worldGrid[52][52] = mockFactoryTile;
          window.setFactoryFacade(52, 52, 'steel_mill');
          const newSkin = mockFactoryTile.factory.customSkin;

          return { title, hasRecipe, newSkin, ok: title === 'Complexo Siderúrgico' && hasRecipe && newSkin === 'steel_mill' };
        })()
      `,
      returnByValue: true
    });
    console.log('Resultado Teste 4:', testFactory.result.value);
    if (!testFactory.result.value.ok) {
      throw new Error('Falha ao renderizar painel de fábrica: ' + JSON.stringify(testFactory.result.value));
    }

    console.log('\n--- Teste 5: Inspeção de Fazenda Agropecuária ---');
    const testFarm = await sendCdp('Runtime.evaluate', {
      expression: `
        (() => {
          const mockFarmTile = {
            x: 53, y: 53,
            district: { name: 'Cinturão Verde', landRentDaily: 10 },
            farm: {
              name: 'Granja Esperança',
              cropName: 'Aves & Frangos',
              farmTypeId: 'farm_poultry',
              dailyYield: 80,
              quality: 65,
              dailyOperatingCost: 0.80,
              stock: 350,
              maxCapacity: 1000,
              feedConfig: { active: true, supplierName: 'Porto', landedCost: 0.50 }
            }
          };
          window.FacilityPanel.renderFarmPanel(mockFarmTile);
          const title = document.getElementById('facility-title')?.textContent;
          const hasFeed = document.getElementById('facility-content-panel')?.textContent?.includes('Ração');
          return { title, hasFeed, ok: title === 'Granja Esperança' && hasFeed };
        })()
      `,
      returnByValue: true
    });
    console.log('Resultado Teste 5:', testFarm.result.value);
    if (!testFarm.result.value.ok) {
      throw new Error('Falha ao renderizar fazenda: ' + JSON.stringify(testFarm.result.value));
    }

    console.log('\n--- Teste 6: Inspeção de Mina Extrativista ---');
    const testMine = await sendCdp('Runtime.evaluate', {
      expression: `
        (() => {
          const mockMineTile = {
            x: 54, y: 54,
            district: { name: 'Serra do Ferro', landRentDaily: 15 },
            mine: {
              name: 'Lavra de Ferro Bruto',
              resourceId: 'iron',
              resourceName: 'Minério de Ferro',
              dailyYield: 150,
              unitCost: 3.50,
              quality: 75,
              stock: 800,
              maxCapacity: 2000
            }
          };
          window.FacilityPanel.renderMinePanel(mockMineTile);
          const title = document.getElementById('facility-title')?.textContent;
          const content = document.getElementById('facility-content-panel')?.textContent;
          const hasOre = content?.includes('Minério de Ferro') && content?.includes('150 un/dia');
          return { title, hasOre, ok: hasOre };
        })()
      `,
      returnByValue: true
    });
    console.log('Resultado Teste 6:', testMine.result.value);
    if (!testMine.result.value.ok) {
      throw new Error('Falha ao renderizar mina: ' + JSON.stringify(testMine.result.value));
    }

    console.log('\n--- Teste 7: DREPanel & Modal de Insolvência ---');
    const testFinance = await sendCdp('Runtime.evaluate', {
      expression: `
        (() => {
          window.DREPanel.openInsolvencyModal({ netWorth: -50000 });
          const modal = document.getElementById('insolvency-modal');
          const isVisible = modal && !modal.classList.contains('hidden');
          window.DREPanel.closeInsolvencyModal();
          const isHiddenAfter = modal && modal.classList.contains('hidden');

          window.DREPanel.syncDREValues(10000, 4000, 1000, 500, 4500, 200, 150000);
          const gross = document.getElementById('dre-gross-sales')?.textContent;

          return { isVisible, isHiddenAfter, gross, ok: isVisible && isHiddenAfter && (gross?.includes('10.000') || gross?.includes('10,000')) };
        })()
      `,
      returnByValue: true
    });
    console.log('Resultado Teste 7:', testFinance.result.value);
    if (!testFinance.result.value.ok) {
      throw new Error('Falha nos testes de finanças/insolvência: ' + JSON.stringify(testFinance.result.value));
    }

    console.log('\n✅ TODOS OS 7 TESTES E2E DE INSPETORES E FINANÇAS PASSARAM COM SUCESSO!\n');

  } catch (err) {
    console.error('❌ ERRO NO TESTE E2E:', err);
    exitCode = 1;
  } finally {
    if (edgeProc) edgeProc.kill();
    viteProcess.kill();
    process.exit(exitCode);
  }
}

run();
