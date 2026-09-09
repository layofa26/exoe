import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  RotateCcw, 
  Tag, 
  Layers, 
  AlertCircle, 
  FileText, 
  Award, 
  RefreshCw, 
  Download, 
  ShieldAlert, 
  Wallet,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { VaultStatsCard } from '../../components/common/VaultStatsCard';
import { TransactionRecord } from '../../types/vault';

const INITIAL_TRANSACTIONS: TransactionRecord[] = [
  {
    id: 'tx_001',
    userId: 'usr_001',
    userName: 'Jean-Marc Baptiste',
    userEmail: 'jm.baptiste@example.ht',
    amount: 149.99,
    currency: 'USD',
    planName: 'Abonnement Annuel Pro',
    paymentGateway: 'moncash',
    status: 'success',
    createdAt: '2026-03-05 16:40',
    invoiceUrl: '/invoices/inv_001.pdf',
  },
  {
    id: 'tx_002',
    userId: 'usr_005',
    userName: 'Dr. Rachel Moïse',
    userEmail: 'dr.moise@clinique.ht',
    amount: 19.99,
    currency: 'USD',
    planName: 'Mensuel Pro Certifié',
    paymentGateway: 'card',
    status: 'success',
    createdAt: '2026-03-04 11:20',
    invoiceUrl: '/invoices/inv_002.pdf',
  },
  {
    id: 'tx_003',
    userId: 'usr_004',
    userName: 'Steeve Louissaint',
    userEmail: 'steeve.spam@fake.net',
    amount: 199.99,
    currency: 'USD',
    planName: 'Pack Publicitaire Boost',
    paymentGateway: 'stripe',
    status: 'failed',
    createdAt: '2026-03-03 08:15',
    isFraudAlert: true,
  }
];

export const MonetizationSection: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionRecord[]>(INITIAL_TRANSACTIONS);
  const [notice, setNotice] = useState<string | null>(null);

  // 6. Gestionnaire de codes promo
  const [promoCodes, setPromoCodes] = useState([
    { code: 'EXILE2026', discount: '20%', uses: 45, maxUses: 100, active: true },
    { code: 'PRO_LAUNCH', discount: '10$', uses: 18, maxUses: 50, active: true },
  ]);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoDiscount, setNewPromoDiscount] = useState('');

  const triggerNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  // 5. Remboursement manuel
  const handleRefund = (txId: string) => {
    if (window.confirm('Confirmer le remboursement de cette transaction ?')) {
      setTransactions(transactions.map(t => t.id === txId ? { ...t, status: 'refunded' } : t));
      triggerNotice('Transaction remboursée et notification envoyée au client.');
    }
  };

  // 6. Ajouter code promo
  const handleAddPromo = () => {
    if (!newPromoCode.trim() || !newPromoDiscount.trim()) return;
    setPromoCodes([
      ...promoCodes,
      { code: newPromoCode.trim().toUpperCase(), discount: newPromoDiscount.trim(), uses: 0, maxUses: 100, active: true }
    ]);
    setNewPromoCode('');
    setNewPromoDiscount('');
    triggerNotice('Nouveau code promotionnel activé.');
  };

  // 9. Relance paiement échoué
  const handleRetryFailedPayment = (txId: string) => {
    triggerNotice('Tentative de relance automatique et email de notification envoyés.');
  };

  // 15. Export rapport financier
  const handleExportFinancialReport = () => {
    triggerNotice('Bilan comptable et financier (CSV/PDF) généré avec succès.');
  };

  return (
    <div className="space-y-6">
      {notice && (
        <div className="p-3 bg-emerald-600/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-sm flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-xs text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            <span>Monétisation & Revenus de la Plateforme</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gestion des abonnements, transactions MonCash/Carte et codes promos
          </p>
        </div>

        {/* 15. Export rapport financier */}
        <button
          onClick={handleExportFinancialReport}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>15. Exporter Bilan Comptable</span>
        </button>
      </div>

      {/* 2. Revenus Journaliers, Mensuels (MRR), Annuels (ARR) & 12. Taux de conversion */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <VaultStatsCard
          title="2. Revenu Journalier"
          value="480.00 $"
          subtitle="Encaissé aujourd'hui"
          icon={DollarSign}
          trend={{ value: "+12.4%", isPositive: true }}
          colorScheme="emerald"
        />

        <VaultStatsCard
          title="2. MRR (Mensuel)"
          value="12,450 $"
          subtitle="Revenus récurrents mensuels"
          icon={TrendingUp}
          trend={{ value: "+18.2%", isPositive: true }}
          colorScheme="blue"
        />

        <VaultStatsCard
          title="1. Abonnés Premium"
          value="428"
          subtitle="Abonnements actifs"
          icon={Award}
          trend={{ value: "+32 ce mois", isPositive: true }}
          colorScheme="purple"
        />

        <VaultStatsCard
          title="12. Taux de Conversion"
          value="4.6%"
          subtitle="Gratuit vers Pro Payant"
          icon={TrendingUp}
          trend={{ value: "+0.8%", isPositive: true }}
          colorScheme="amber"
        />
      </div>

      {/* 3. Graphique Revenus & 13. Répartition MonCash / Carte */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>3. Évolution du Chiffre d'Affaires en Temps Réel</span>
              </h3>
              <p className="text-xs text-slate-400">Croissance des souscriptions mensuelles</p>
            </div>
            <span className="text-xs text-emerald-400 font-mono font-bold bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-900/40">
              ARR Estimé : 149,400 $
            </span>
          </div>

          <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-800">
            {[
              { m: 'Oct', v: 45 },
              { m: 'Nov', v: 60 },
              { m: 'Déc', v: 75 },
              { m: 'Jan', v: 85 },
              { m: 'Fév', v: 92 },
              { m: 'Mar', v: 100 },
            ].map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  style={{ height: `${bar.v}%` }}
                  className="w-full bg-gradient-to-t from-emerald-700 to-teal-400 rounded-t-lg transition-all"
                />
                <span className="text-xs text-slate-400">{bar.m}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center text-xs text-slate-400 mt-3">
            <span>Passerelles de paiement : <strong>MonCash & Carte bancaire actives</strong></span>
            <span className="text-emerald-400 font-medium">99.8% de succès aux encaissements</span>
          </div>
        </div>

        {/* 13. Ventilation par source de paiement */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Wallet className="w-4 h-4 text-blue-400" />
              <span>13. Passerelles de Paiement</span>
            </h3>

            <div className="space-y-3 mt-4 text-xs">
              {[
                { name: 'MonCash (Haïti)', pct: 64, color: 'bg-red-500' },
                { name: 'Carte Bancaire (Stripe)', pct: 28, color: 'bg-blue-500' },
                { name: 'Natcash (Mobile)', pct: 8, color: 'bg-orange-500' },
              ].map((p, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>{p.name}</span>
                    <span className="font-semibold text-white">{p.pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full">
                    <div style={{ width: `${p.pct}%` }} className={`h-full ${p.color} rounded-full`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 14. Alerte Fraude */}
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span>14. Détection Fraude : 1 tentative de carte compromise bloquée</span>
          </div>
        </div>
      </div>

      {/* 4. Historique des Transactions & 5. Remboursement & 10. Factures */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-400" />
            <span>4. Historique des Transactions Récentes</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">3 dernières transactions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Client</th>
                <th className="px-4 py-3">Offre</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Passerelle</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/30">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-white">{tx.userName}</div>
                    <span className="text-[10px] text-slate-500">{tx.userEmail}</span>
                  </td>
                  <td className="px-4 py-3.5">{tx.planName}</td>
                  <td className="px-4 py-3.5 font-bold font-mono text-white">
                    {tx.amount} {tx.currency}
                  </td>
                  <td className="px-4 py-3.5 capitalize font-mono text-blue-300">
                    {tx.paymentGateway}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${
                      tx.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                      tx.status === 'failed' ? 'bg-rose-500/20 text-rose-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 font-mono">{tx.createdAt}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* 10. Facture PDF */}
                      {tx.status === 'success' && (
                        <button
                          onClick={() => triggerNotice(`10. Facture ${tx.id}.pdf téléchargée.`)}
                          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                          title="10. Télécharger Facture PDF"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* 5. Remboursement manuel */}
                      {tx.status === 'success' && (
                        <button
                          onClick={() => handleRefund(tx.id)}
                          className="p-1 rounded-lg bg-slate-800 hover:bg-rose-600/30 text-slate-400 hover:text-rose-400"
                          title="5. Rembourser cette transaction"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* 9. Relance si échoué */}
                      {tx.status === 'failed' && (
                        <button
                          onClick={() => handleRetryFailedPayment(tx.id)}
                          className="px-2 py-1 rounded-lg bg-blue-600/20 text-blue-400 text-[10px] font-semibold hover:bg-blue-600/40"
                          title="9. Relancer paiement"
                        >
                          Relancer
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Gestionnaire de Codes Promo */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-purple-400" />
          <span>6. Gestionnaire de Codes Promotionnels & Réductions</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {promoCodes.map((p, i) => (
            <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-purple-400 text-xs">{p.code}</span>
                <span className="text-[10px] text-slate-500 block">Réduction : {p.discount}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{p.uses}/{p.maxUses} utilisés</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2 max-w-md">
          <input
            type="text"
            value={newPromoCode}
            onChange={(e) => setNewPromoCode(e.target.value)}
            placeholder="Ex: SPECIAL50"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
          />
          <input
            type="text"
            value={newPromoDiscount}
            onChange={(e) => setNewPromoDiscount(e.target.value)}
            placeholder="Remise (ex: 20%)"
            className="w-28 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
          />
          <button
            onClick={handleAddPromo}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold"
          >
            Créer Code
          </button>
        </div>
      </div>
    </div>
  );
};
