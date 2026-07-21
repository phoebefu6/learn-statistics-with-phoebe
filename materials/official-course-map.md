# Official course map - learn-statistics-with-phoebe

Foundational statistics + probability, two-track (leader a1-a6 read-only, builder b1-b10 Python).
Running dataset: **Lumen Skincare** (see `lumen-canon.md`). Difficulty tier **2 (Core)**. This course
is the prequel to `learn-experimentation-with-phoebe` and the on-ramp under `learn-intro-ml`.

Sources deep-researched (real syllabi, verified URLs in the appendix): OpenIntro Statistics (spine),
Google "The Power of Statistics" (Coursera), 365 Data Science "Statistics", Khan Academy Stats &
Probability, StatQuest fundamentals (MLE + fallacies), Coursera "Basic Statistics" (UvA).

**Coverage bar:** each session teaches ~80% of its mapped sources' working content on that topic, on
Lumen data. Certificates, graded exams, and lecture videos stay with the official courses - said
honestly on every page. Fallacies module is **authored fresh** (no single source packages Simpson's
paradox + base-rate + p-hacking cleanly - confirmed in research).

---

## The arc (ladder easy -> hard; everyone starts at session 1 of their track)

### Leader track - read & interpret statistics, no code (6 x ~45 min)
| # | Session | Covers | Diff |
|---|---|---|---|
| a1 | Reading the data | center (mean/median/mode), spread (range/IQR/SD), shape/skew, percentiles, histogram vs boxplot, why the mean lies on money | green |
| a2 | Thinking in odds | probability basics, independence, conditional probability, Bayes + base rates, the gambler's fallacy | green |
| a3 | The bell and its cousins | the normal curve (68-95-99.7), binomial (counts of yes/no), Poisson (events per period), z-scores, reading a distribution | yellow |
| a4 | What a sample can say | population vs sample, sampling error, the Central Limit Theorem, standard error, margin-of-error feel | yellow |
| a5 | The number and its error bars | point vs interval estimate, what a 95% CI really means (+ 3 wrong readings), reading CIs on a dashboard | yellow |
| a6 | Real or noise? | the logic of a test, p-value (correct definition), significance vs importance, Type I/II + power in words, the fallacy gauntlet; capstone: read a Lumen A/B result like an exec | orange |

### Builder track - Python numpy / scipy.stats / statsmodels (10 x ~45 min)
| # | Session | Covers | Tooling | Diff |
|---|---|---|---|---|
| b1 | Describe the data | simulate Lumen (seed 42), mean/median/std/percentiles, skew/kurtosis, histogram/boxplot | numpy, pandas `.describe()`, matplotlib | green |
| b2 | Probability & simulation | sample spaces, conditional prob, Bayes in code, Monte Carlo, law of large numbers | `np.random` (Generator), simulation | green |
| b3 | Random variables, E & Var | discrete vs continuous RVs, E[X], Var[X], covariance, pmf/pdf/cdf | scipy.stats objects | yellow |
| b4 | Distributions in scipy | normal, binomial, Poisson (+ uniform, exponential, lognormal), pdf/pmf/cdf/ppf, Q-Q, fit | scipy.stats, matplotlib | yellow |
| b5 | Sampling & the CLT | sampling distributions, standard error, CLT by resampling (the money demo), bootstrap intro | numpy, scipy.stats | yellow |
| b6 | Estimation & MLE | estimators, bias/consistency, method of moments, maximum likelihood (derive + fit), bootstrap CI | scipy.optimize, scipy.stats `.fit` | orange |
| b7 | Confidence intervals | z & t intervals for a mean, Wald + Wilson for a proportion, bootstrap CI, interpretation | scipy.stats, statsmodels `proportion_confint` | orange |
| b8 | Hypothesis testing | null/alt, test stat, p-value, Type I/II, power, alpha; one/two-sample t-test, two-proportion z-test | scipy.stats `ttest_ind`, statsmodels `proportions_ztest`, `TTestIndPower` | orange |
| b9 | Chi-square & ANOVA | chi-square goodness-of-fit + independence (channel x convert), one-way ANOVA (AOV by category), nonparametric fallback | scipy.stats `chisquare`/`chi2_contingency`/`f_oneway`/`mannwhitneyu` | orange |
| b10 | Correlation, regression & fallacies | Pearson/Spearman, corr != causation, simple + multiple OLS, R^2, residuals; p-hacking sim, multiple comparisons (Bonferroni/FDR), Simpson's paradox in code | scipy.stats, statsmodels `OLS`, `multitest` | red |

**Live vs self-study:** every session tags concept cards `Live` (fits the 45 min: ~3 welcome / 15
concept / 22 build-along / 5 Q&A) vs `Self-study` (full depth after class). This is how ~3-4 hours of
source content per topic fits one session honestly.

**stat-live.js playground** (signature interactive layer, on the landing page + embedded where relevant):
1. **Distribution sampler** - normal/binomial/Poisson, drag params, sample vs theoretical curve + live mean/SD.
2. **CLT convergence** - draw sample means from a skewed (Lumen AOV) population, watch them go normal as n grows; SE shrinks.
3. **Test & CI sandbox** - control 3.2% vs variant, adjust effect + n/arm, watch z, p-value, and CIs move; "significant?" verdict.

---

## Per-topic source coverage (which official source backs each area)

Legend: ✓ strong / ◐ partial / ✗ absent. (365, GA = Google Power of Statistics, OI = OpenIntro,
KA = Khan, SQ = StatQuest, UvA = Amsterdam Basic Statistics.)

| Topic (our session) | 365 | GA | OI | KA | SQ | UvA |
|---|---|---|---|---|---|---|
| Descriptive stats - a1/b1 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Probability + Bayes - a2/b2 | ◐ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Distributions normal/binomial/Poisson - a3/b4 | ◐ | ✓ | ✓ | ✓ | ✓ | ◐ |
| Random variables, E, Var - b3 | ◐ | ◐ | ✓ | ✓ | ✓ | ✓ |
| Sampling + CLT - a4/b5 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Estimation + MLE - b6 | ◐ | ◐ | ✓ | ◐ | ✓ | ◐ |
| Confidence intervals - a5/b7 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Hypothesis testing t/z/chi-square - a6/b8/b9 | ✓ | ◐ | ✓ | ✓ | ✓ | ◐ |
| Correlation vs regression - b10 | ◐ | ✗ | ✓ | ✓ | ✓ | ✓ |
| Statistical fallacies - a6/b10 | ✗ | ◐ | ◐ | ◐ | ◐ | ◐ (authored fresh) |

**Accuracy flags carried into the build (from research):**
- Poisson explicit only in OI / GA / KA - our a3/b4 teach it on Lumen daily-orders (lambda = 128) + tickets (lambda = 5).
- MLE only in OI (light) + SQ (worked) - b6 derives it and shows the likelihood curve peaking at the sample proportion.
- Chi-square in OI + KA only - b9 owns it (SRM-style channel x convert table, matches exp b3).
- Fallacies: no source packages Simpson's / base-rate cleanly -> authored fresh in a6 + b10 on Lumen numbers.

## Not covered by design (say so on the pages)
- Bayesian inference beyond base-rate intuition (priors/posteriors/MCMC) - flagged as the natural next step.
- Full regression modelling (logistic, regularisation, diagnostics) -> `learn-classification-regression` / `learn-intro-ml`.
- Experiment design, power planning at depth, causal inference -> `learn-experimentation-with-phoebe` (the sequel).
- Time series, survival analysis, multivariate methods - out of scope for a foundations on-ramp.
- Official certificates, graded exams, lecture videos - stay with the source courses.

---

## "Finish these from your subscriptions" - top picks (ranked)
Phoebe over-subscribes; mine these before consolidating to DeepLearning.AI (end 2026). Ranked for THIS topic:
1. **OpenIntro Statistics** (free PDF + videos) - the single best structural spine; read ch 1-8.
2. **Google "The Power of Statistics"** (Coursera, in the Advanced Data Analytics cert) - Python-first, A/B-testing flavour that matches the Lumen bridge.
3. **StatQuest "Statistics Fundamentals"** (YouTube/statquest.org) - intuition + the MLE and p-hacking pieces the others skip.
4. **365 Data Science "Statistics"** - tight CI + hypothesis-testing teaching flow, good for the leader framing.
5. **Coursera "Basic Statistics" (Univ. of Amsterdam)** - clean correlation/regression + probability build-up.

## Appendix - fetched syllabi (verified URLs)
- 365 Data Science Statistics - https://365datascience.com/courses/statistics/ (6 sections: intro, descriptive, inferential fundamentals, CIs, hypothesis testing, project+exam)
- Google Power of Statistics - https://www.coursera.org/learn/the-power-of-statistics (6 modules: intro/descriptive, probability, sampling, CIs, hypothesis testing, project)
- OpenIntro Statistics - https://www.openintro.org/book/os/ (9 chapters: data, summarizing, probability, distributions, inference foundations, categorical inference, numerical inference, linear regression, multiple/logistic)
- Khan Academy Stats & Probability - https://www.khanacademy.org/math/statistics-probability (16 units, descriptive -> ANOVA)
- StatQuest fundamentals - https://statquest.org/video_index.html (histograms -> distributions -> CLT -> hypothesis testing -> p-values/p-hacking -> MLE -> regression)
- Coursera Basic Statistics (UvA) - https://www.coursera.org/learn/basic-statistics (8 modules: exploring data, correlation/regression, probability, distributions, sampling, CIs, significance tests, exam)
