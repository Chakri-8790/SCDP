const fs   = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorMiddleware');

const authRoutes         = require('./routes/authRoutes');
const projectRoutes      = require('./routes/projectRoutes');
const predictionRoutes   = require('./routes/predictionRoutes');
const analyticsRoutes    = require('./routes/analyticsRoutes');
const adminRoutes        = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// ── CORS ─────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'https://scdp-frontend.onrender.com',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ── Body Parsing ──────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Rate Limiting ─────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// ── Routes ────────────────────────────────────────────────────────────
app.use('/api/auth',          authLimiter, authRoutes);
app.use('/api/projects',      apiLimiter,  projectRoutes);
app.use('/api/predictions',   apiLimiter,  predictionRoutes);
app.use('/api/analytics',     apiLimiter,  analyticsRoutes);
app.use('/api/admin',         apiLimiter,  adminRoutes);
app.use('/api/notifications', apiLimiter,  notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'SmartConstruct API is running', timestamp: new Date().toISOString() });
});

// ── Public performance metrics — no auth required ─────────────────
app.get('/api/performance', (req, res) => {
  try {
    const metaPath = path.join(__dirname, '../ml-service/artifacts/model_meta.json');
    if (!fs.existsSync(metaPath)) {
      return res.status(404).json({ success: false, message: 'Model artifacts not found. Run training first.' });
    }
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

    const fmt  = (v) => v != null ? parseFloat((v * 100).toFixed(2)) : null;
    const best = meta.metrics;
    const cr   = best.classification_report;

    // ── Detect binary vs 4-class ──────────────────────────────────
    const isBinary = meta.target === 'binary' ||
                     (meta.classes && meta.classes.includes('No Delay'));

    // ── Per-class breakdown ───────────────────────────────────────
    let perClass = [];
    if (isBinary) {
      // binary: class keys are 'No Delay' and 'Delay'
      const classLabels = meta.classes || ['No Delay', 'Delay'];
      perClass = classLabels.map((label, i) => {
        const c = cr[label];
        if (!c) return null;
        return {
          class:    label,
          classKey: String(i),
          precision: fmt(c.precision),
          recall:    fmt(c.recall),
          f1:        fmt(c['f1-score']),
          support:   c.support,
        };
      }).filter(Boolean);
    } else {
      // legacy 4-class: class keys are '0','1','2','3'
      const CLASS_LABELS = ['On Schedule', 'Potential Delay', 'Likely Delayed', 'Severe Delay Risk'];
      perClass = ['0', '1', '2', '3'].map((k, i) => {
        const c = cr[k];
        if (!c) return null;
        return {
          class:    CLASS_LABELS[i],
          classKey: k,
          precision: fmt(c.precision),
          recall:    fmt(c.recall),
          f1:        fmt(c['f1-score']),
          support:   c.support,
        };
      }).filter(Boolean);
    }

    // ── Overall metrics — handle both key naming conventions ──────
    // new training uses: precision, recall, f1, roc_auc
    // old training used: precision_macro, recall_macro, f1_macro, roc_auc_ovr
    const macroAvg = cr['macro avg'] || {};
    const wgtAvg   = cr['weighted avg'] || {};

    const overall = {
      accuracy:          fmt(best.accuracy),
      precisionMacro:    fmt(best.precision      ?? best.precision_macro  ?? macroAvg.precision),
      recallMacro:       fmt(best.recall         ?? best.recall_macro     ?? macroAvg.recall),
      f1Macro:           fmt(best.f1             ?? best.f1_macro         ?? macroAvg['f1-score']),
      rocAuc:            fmt(best.roc_auc        ?? best.roc_auc_ovr      ?? null),
      precisionWeighted: fmt(wgtAvg.precision),
      recallWeighted:    fmt(wgtAvg.recall),
      f1Weighted:        fmt(wgtAvg['f1-score']),
    };

    // ── All model comparison ──────────────────────────────────────
    const allModels = (meta.all_metrics || []).map(m => ({
      name:      m.model,
      accuracy:  fmt(m.accuracy),
      precision: fmt(m.precision  ?? m.precision_macro),
      recall:    fmt(m.recall     ?? m.recall_macro),
      f1:        fmt(m.f1         ?? m.f1_macro),
      rocAuc:    fmt(m.roc_auc    ?? m.roc_auc_ovr ?? null),
    }));

    // ── Feature importances sorted desc ──────────────────────────
    const featureImportances = Object.entries(meta.feature_importances || {})
      .map(([name, val]) => ({ name, importance: parseFloat((val * 100).toFixed(2)) }))
      .sort((a, b) => b.importance - a.importance);

    res.json({
      success: true,
      data: {
        bestModel:          meta.best_model,
        trainedAt:          meta.trained_at,
        nSamples:           meta.n_samples,
        nFeatures:          meta.n_features,
        classes:            meta.classes,
        target:             meta.target || (isBinary ? 'binary' : 'multiclass'),
        overall,
        confusionMatrix:    best.confusion_matrix,
        perClass,
        allModels,
        featureImportances,
      },
    });
  } catch (err) {
    console.error('/api/performance error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to read model metrics: ' + err.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Central error handler
app.use(errorHandler);

module.exports = app;
