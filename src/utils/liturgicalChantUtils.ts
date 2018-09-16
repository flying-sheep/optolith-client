import * as R from 'ramda';
import * as Data from '../types/data';
import * as Wiki from '../types/wiki';
import { getSkillCheckValues } from './AttributeUtils';
import { Just, List, Maybe, OrderedMap, Record } from './dataUtils';
import { flattenDependencies } from './flattenDependencies';
import { flip } from './flip';
import { getNumericBlessedTraditionIdByInstanceId } from './IDUtils';
import { getActiveSelections } from './selectionUtils';
import { getExceptionalSkillBonus } from './skillUtils';

export const isOwnTradition = (
  tradition: Record<Wiki.SpecialAbility>,
  obj: Record<Wiki.LiturgicalChant> | Record<Wiki.Blessing>,
): boolean => obj.get ('tradition')
  .any (e => {
    const numericId = tradition.lookup ('id')
      .bind (getNumericBlessedTraditionIdByInstanceId);

    return e === 1 || Maybe.of (e).equals (numericId.fmap (R.inc));
  });

export const isIncreasable = (
  tradition: Record<Wiki.SpecialAbility>,
  wikiEntry: Record<Wiki.LiturgicalChant>,
  instance: Record<Data.ActivatableSkillDependent>,
  startEL: Record<Wiki.ExperienceLevel>,
  phase: number,
  attributes: OrderedMap<string, Record<Data.AttributeDependent>>,
  exceptionalSkill: Maybe<Record<Data.ActivatableDependent>>,
  aspectKnowledge: Maybe<Record<Data.ActivatableDependent>>,
): boolean => {
  const bonus = getExceptionalSkillBonus (wikiEntry.lookup ('id')) (exceptionalSkill);

  const hasAspectKnowledgeRestriction = getActiveSelections (aspectKnowledge)
    .fmap (aspects => {
      const hasActiveAspect = aspects.any (e => wikiEntry.get ('aspects').elem (e as number));
      const noNamelessTradition = tradition.get ('id') !== 'SA_693';

      return !hasActiveAspect && noNamelessTradition;
    });

  const maxList = List.of (
    getSkillCheckValues (attributes) (wikiEntry.get ('check')).maximum () + 2
  );

  const getAdditionalMax = R.pipe (
    (list: typeof maxList) => phase < 3
      ? list.append (startEL.get ('maxSkillRating'))
      : list,
    (list: typeof maxList) => Maybe.elem (true) (hasAspectKnowledgeRestriction)
      ? list.append (14)
      : list
  );

  const max = getAdditionalMax (maxList).minimum ();

  return instance.get ('value') < max + bonus;
};

export const getAspectCounter = (
  wiki: OrderedMap<string, Record<Wiki.LiturgicalChant>>,
  state: OrderedMap<string, Record<Data.ActivatableSkillDependent>>
) =>
  state.filter (e => e.get ('value') >= 10)
    .foldl<OrderedMap<number, number>> (
      acc => instance =>
        Maybe.maybe<Record<Wiki.LiturgicalChant>, OrderedMap<number, number>> (acc) (
          wikiEntry => wikiEntry.get ('aspects')
            .foldl<OrderedMap<number, number>> (
              acc1 => acc1.alter (
                R.pipe (
                  Maybe.fromMaybe (0),
                  R.inc,
                  Just
                )
              )
            ) (acc)
        ) (wiki.lookup (instance.get ('id')))
    ) (OrderedMap.empty ());

export const isDecreasable = (
  wiki: Record<Wiki.WikiAll>,
  state: Record<Data.HeroDependent>,
  wikiEntry: Record<Wiki.LiturgicalChant>,
  instance: Record<Data.ActivatableSkillDependent>,
  liturgicalChants: OrderedMap<string, Record<Data.ActivatableSkillDependent>>,
  aspectKnowledge: Maybe<Record<Data.ActivatableDependent>>,
): boolean => {
  const dependencies = flattenDependencies<number | boolean> (
    wiki,
    state,
    instance.get ('dependencies'),
  );

  // Basic validation
  const valid = instance.get ('value') < 1
    ? dependencies.notElem (true)
    : instance.get ('value') > Math.max (0, ...dependencies.filter (isNumber));

  return Maybe.fromMaybe (valid) (
    getActiveSelections (aspectKnowledge)
      // Check if liturgical chant is part of dependencies of active Aspect Knowledge
      .bind (Maybe.ensure (
        activeAspects => activeAspects.any (
          e => isNumber (e) && wikiEntry.get ('aspects').elem (e)
        )
      ))
      .fmap (
        activeAspects => {
          const counter = getAspectCounter (wiki.get ('liturgicalChants'), liturgicalChants);

          const countedLowestWithProperty = wikiEntry.get ('aspects').foldl<number> (
            n => aspect => {
              const counted = counter.lookup (aspect);

              if (Maybe.isJust (counted) && activeAspects.elem (aspect)) {
                return Math.min (Maybe.fromJust (counted), n);
              }

              return n;
            }
          ) (4);

          return (instance.get ('value') !== 10 || countedLowestWithProperty > 3) && valid;
        }
      )
  );
};

// Keys are aspects and their value is the respective tradition
const traditionsByAspect = OrderedMap.of ([
  [1, 1],
  [2, 2],
  [3, 2],
  [4, 3],
  [5, 3],
  [6, 4],
  [7, 4],
  [8, 5],
  [9, 5],
  [10, 6],
  [11, 6],
  [12, 7],
  [13, 7],
  [14, 8],
  [15, 8],
  [16, 9],
  [17, 9],
  [18, 10],
  [19, 10],
  [20, 11],
  [21, 11],
  [22, 12],
  [23, 12],
  [24, 13],
  [25, 13],
  [26, 15],
  [27, 15],
  [28, 16],
  [29, 16],
  [30, 17],
  [31, 17],
  [32, 18],
  [33, 18],
  [34, 19],
  [35, 19],
]);

/**
 * Returns the tradition id used by chants. To get the tradition SId for the
 * actual special ability, you have to decrease the return value by 1.
 * @param aspectId The id used for chants or Aspect Knowledge.
 */
export const getTraditionOfAspect = traditionsByAspect.findWithDefault (1);

// Keys are traditions and their values are their respective aspects
const aspectsByTradition = OrderedMap.of<number, List<number>> ([
  [1, List.of ()],
  [2, List.of (2, 3)],
  [3, List.of (4, 5)],
  [4, List.of (6, 7)],
  [5, List.of (8, 9)],
  [6, List.of (10, 11)],
  [7, List.of (12, 13)],
  [8, List.of (14, 15)],
  [9, List.of (16, 17)],
  [10, List.of (18, 19)],
  [11, List.of (20, 21)],
  [12, List.of (22, 23)],
  [13, List.of (24, 25)],
  [14, List.of ()],
  [15, List.of (26, 27)],
  [16, List.of (28, 29)],
  [17, List.of (30, 31)],
  [18, List.of (32, 33)],
  [19, List.of (34, 35)],
]);

/**
 * Return the aspect ids used for chants and Aspect Knowledge.
 * @param traditionId The id used by chants. If you only have the SId from the
 * actual special ability, you have to increase the value by 1 before passing
 * it.
 */
export const getAspectsOfTradition = R.pipe (
  aspectsByTradition.findWithDefault (List.of<number> ()),
  flip<List<number>, number, List<number>> (List.cons) (1)
);
