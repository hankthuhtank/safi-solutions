/* Moneywise live data settings.
   apiUrl: address of the deployed Worker in moneywise/worker (see its README), e.g.
     'https://moneywise-rates.safisolutions.workers.dev'
   Leave it empty to show the bundled snapshot (moneywise/data/rates-snapshot.json); every number then says
   "Snapshot" with its date instead of "Live". */
export const CONFIG = {
  apiUrl: '',
  timeoutMs: 4500,
};
