# Lumen Skincare - the running dataset (statistics-course canon)

Every session in both tracks uses **Lumen Skincare**, the synthetic DTC e-commerce skincare
brand reused from `learn-experimentation-with-phoebe`. This statistics course is the **prequel**:
it teaches the foundations that the experimentation course then uses to run A/B tests. Same brand,
same numbers, so a learner flows straight from "what is a confidence interval" here into "size and
read an A/B test" there. Do NOT invent different figures - reuse these so every session reconciles.

## The brand in one line
Lumen Skincare: an $18M/yr direct-to-consumer skincare label, 9 marketing channels, ~2 year
history. We study its checkout, orders, and traffic to learn statistics on real-shaped data.

## Canonical numbers (use everywhere - these ARE the teaching examples)

| Quantity | Value | First taught in | Feeds experimentation |
|---|---|---|---|
| Checkout conversion rate (control) | **3.2%** (p = 0.032) | a2 / b2 (probability), a4/b5 (CLT) | baseline for every A/B test |
| Variant conversion rate (hypothesised) | **3.6%** (+0.4pp abs, +12.5% rel) | a6 / b8 (hypothesis test) | the MDE in exp b2 |
| Order value (AOV) | mean **~$74**, right-skewed, the canonical single order = **$92** | a1 / b1 (descriptive), b4 (fit) | revenue per session |
| Order value spread | SD ~$38, median ~$63 (mean > median => right skew) | a1 / b1 | - |
| Daily checkout sessions | **~4,000/day** | a4 / b5 (sampling), b4 (Poisson) | daily eligible traffic in exp |
| Daily orders (Poisson mean) | ~4,000 x 3.2% = **~128 orders/day** (lambda = 128) | a3 / b4 (Poisson) | - |
| Prior-30-day spend vs order value | Pearson r **~0.6** (r^2 ~ 0.36) | a6 / b10 (correlation) | the CUPED covariate in exp b7 |
| Support tickets / hour | Poisson, lambda ~ 5 | a3 / b4 (Poisson) | - |

### Derived teaching results (state assumptions with every number)
- **Expected revenue per checkout session** = p x AOV = 0.032 x $74 ~= **$2.37**. (b3, expectation.)
- **Std error of a proportion** at n = 1,000: sqrt(0.032 x 0.968 / 1000) ~= **0.56pp**. (a4/b5/b7.)
- **95% CI for control conversion** from n = 5,000 conversions observed at 3.2%:
  3.2% +/- 1.96 x sqrt(.032 x .968 / 5000) => **3.2% +/- 0.49pp => [2.71%, 3.69%]** (Wald). Note the
  variant's 3.6% sits INSIDE this interval at n = 5,000 - which is exactly why the experimentation
  course needs ~32,000/arm to separate them. (b7 -> bridges to exp b2.)
- **Two-proportion z-test** 3.2% vs 3.6%: at n = 5,000/arm, z ~= 1.16, p ~= 0.25 (not significant);
  at n = 32,000/arm, z ~= 2.8, p ~= 0.005 (significant). Same effect, different n => different verdict.
  This is the punchline of b8 and the whole handoff to experimentation. (VERIFY numbers in stat-live.)

## Data model (reused verbatim from the experimentation canon)
Three tables: `touchpoints` (grain = one interaction), `conversions` (order_value, product_category,
new_vs_returning), `spend_weekly` (aggregate). For THIS course the columns we lean on:
- `conversions.order_value` (FLOAT, mean ~$74, right-skewed) - the descriptive-stats + distribution-fitting variable.
- `conversions.product_category` (cleanser / serum / moisturizer / set) - the ANOVA grouping variable (b9).
- a derived per-session `converted` (BOOL, ~3.2% true) - the binomial / proportion variable.
- a derived per-user `prior_30d_spend` (FLOAT) - the correlation/regression predictor (b10), r ~ 0.6 with order_value.
- `touchpoints.channel` (ENUM of 9) x `converted` - the chi-square independence table (b9).

Builders **simulate** this dataset in b1 with a fixed seed (`np.random.default_rng(42)`) and reuse it
across every builder session - so results are reproducible and match the leader track's stated numbers.

## HARD accuracy notes (do not get these wrong - they are the whole point of a foundations course)
- **Mean vs median on skewed money data:** AOV is right-skewed, so mean ($74) > median ($63). Report the
  median for "typical order". A leader who quotes the mean overstates the typical customer. (a1/b1.)
- **A probability is not a guarantee:** 3.2% conversion means ~3.2 in 100 sessions convert on average,
  not "every 100th session". Independence + the gambler's fallacy. (a2/b2.)
- **CLT is about the distribution of the sample MEAN, not the data.** Order values stay skewed forever;
  the *average of a sample* of them goes normal as n grows. The #1 misunderstanding to correct. (a4/b5.)
- **A 95% CI does NOT mean "95% chance the true value is in this interval."** It means the *procedure*
  captures the true value 95% of the time over many samples. State the correct frequentist reading. (a5/b7.)
- **p-value is P(data this extreme | null true), NOT P(null true).** Not the probability the result is a
  fluke, not the probability H0 is true. Correct definition every time. (a6/b8.)
- **Statistical significance != practical importance.** A +0.01pp lift can be "significant" at huge n and
  still be worthless. Always pair p with an effect size + CI. (a6/b8.)
- **Correlation is not causation**, and r only measures *linear* association - a strong curve can have r ~ 0.
  Anscombe's quartet is the canonical warning. (a6/b10.)
- **Simpson's paradox:** an aggregate trend can reverse within every subgroup. Author fresh (no source
  packages it) - use Lumen: a channel looks better overall but worse in every product category. (a6/b10.)
- **Base-rate neglect:** a 99%-accurate test for a 1-in-1000 condition is wrong most times it fires.
  Bayes with real numbers. (a2/b2.)
- **Multiple comparisons / p-hacking:** test 20 things at alpha 0.05 and ~1 "significant" result is expected
  by chance. Bonferroni / FDR. Simulate it. (a6/b10.)
- **MLE:** maximum likelihood picks the parameter that makes the observed data most probable. For a proportion
  the MLE is just the sample proportion (3.2%); show the likelihood curve peaking there. scipy `.fit`. (b6.)

## Voice + guardrails
- Two tracks: **leader (a1-a6)** = read/interpret statistics, NO code, exec framing; **builder (b1-b10)**
  = Python (numpy / scipy.stats / statsmodels), hands-on, everyone starts at b1.
- Hyphens only, never em/en dash. Attribution "by Phoebe Fu". Warm, plain-English, fun-not-dry.
- This is a **foundational on-ramp (diff 2, Core)**: it sits BELOW experimentation (d3) and intro-ml (d2)
  and is the prerequisite both assume. Teach intuition first, formula second, code third.
