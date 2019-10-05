import * as path from "path";
import { bind, Either, first, fromRight_, isLeft, Left, maybeToEither } from "../../../Data/Either";
import { equals } from "../../../Data/Eq";
import { flip, thrush } from "../../../Data/Function";
import { fmap } from "../../../Data/Functor";
import { Lens_, over, set } from "../../../Data/Lens";
import { all, append, consF, elemF, empty, foldr, List, map, notElemF } from "../../../Data/List";
import { ensure, fromMaybe, Just, mapMaybe, Maybe, Nothing } from "../../../Data/Maybe";
import { lt } from "../../../Data/Num";
import { adjust, elems, insert, lookupF, mapMEitherWithKey, OrderedMap } from "../../../Data/OrderedMap";
import { makeLenses, member, Record } from "../../../Data/Record";
import { fst, Pair, snd } from "../../../Data/Tuple";
import { trace, traceId } from "../../../Debug/Trace";
import { ReduxAction } from "../../Actions/Actions";
import { Categories } from "../../Constants/Categories";
import { ProfessionId, SpecialAbilityId } from "../../Constants/Ids";
import { AdvantageL } from "../../Models/Wiki/Advantage";
import { DisadvantageL } from "../../Models/Wiki/Disadvantage";
import { L10nRecord } from "../../Models/Wiki/L10n";
import { getCustomProfession } from "../../Models/Wiki/Profession";
import { Skill } from "../../Models/Wiki/Skill";
import { SpecialAbility, SpecialAbilityL } from "../../Models/Wiki/SpecialAbility";
import { Spell } from "../../Models/Wiki/Spell";
import { SelectOption } from "../../Models/Wiki/sub/SelectOption";
import { WikiModel, WikiModelL, WikiModelRecord } from "../../Models/Wiki/WikiModel";
import { Activatable, Skillish } from "../../Models/Wiki/wikiTypeHelpers";
import { app_path } from "../../Selectors/envSelectors";
import { pipe, pipe_ } from "../pipe";
import { getWikiSliceGetterByCategory } from "../WikiUtils";
import { csvToList } from "./csvToList";
import { toAdvantage } from "./Entries/toAdvantage";
import { toAdvantageSelectOption } from "./Entries/toAdvantageSelectOption";
import { toAttribute } from "./Entries/toAttribute";
import { toBlessing } from "./Entries/toBlessing";
import { toBook } from "./Entries/toBook";
import { toCantrip } from "./Entries/toCantrip";
import { toCombatTechnique } from "./Entries/toCombatTechnique";
import { toCulture } from "./Entries/toCulture";
import { toDisadvantage } from "./Entries/toDisadvantage";
import { toDisadvantageSelectOption } from "./Entries/toDisadvantageSelectOption";
import { toExperienceLevel } from "./Entries/toExperienceLevel";
import { toItemTemplate } from "./Entries/toItemTemplate";
import { toL10n } from "./Entries/toL10n";
import { toLiturgicalChant } from "./Entries/toLiturgicalChant";
import { toLiturgicalChantExtension } from "./Entries/toLiturgicalChantExtension";
import { toProfession } from "./Entries/toProfession";
import { toProfessionVariant } from "./Entries/toProfessionVariant";
import { toRace } from "./Entries/toRace";
import { toRaceVariant } from "./Entries/toRaceVariant";
import { toSkill } from "./Entries/toSkill";
import { toSpecialAbility } from "./Entries/toSpecialAbility";
import { toSpecialAbilitySelectOption } from "./Entries/toSpecialAbilitySelectOption";
import { toSpell } from "./Entries/toSpell";
import { toSpellExtension } from "./Entries/toSpellExtension";
import { lookupBothRequiredToRecordFromSheetLoading, lookupL10nRequiredToRecordFromSheetLoading, lookupL10nToRecordFromSheetLoading, lookupNoRequiredToRecordFromSheetLoading } from "./FromSheetToRecord";
import { mapMNamed } from "./validateValueUtils";
import { readXLSX } from "./XLSXParser";

const { select } = makeLenses (SpecialAbility)

const matchSelectOptionsToBaseRecords =
  flip (foldr ((p: Pair<string, Record<SelectOption>>) =>
                 adjust (over (select as Lens_<Activatable, Maybe<List<Record<SelectOption>>>>)
                              (pipe (
                                fromMaybe<List<Record<SelectOption>>> (empty),
                                consF (snd (p)),
                                Just
                              )))
                        (fst (p)))) as
    (xs: List<Pair<string, Record<SelectOption>>>) =>
    <A extends Activatable>
    (initial: OrderedMap<string, A>) => OrderedMap<string, A>

const matchExtensionsToBaseRecord: (extensions: List<Record<SelectOption>>) =>
                                   (key: string) =>
                                   (mp: OrderedMap<string, Record<SpecialAbility>>) =>
                                   OrderedMap<string, Record<SpecialAbility>> =
  (extensions: List<Record<SelectOption>>) =>
    adjust (set (select) (Just (extensions)))

const univ_path = path.join (app_path, "app", "Database", "univ.xlsx")

const wrapCsvErr =
  (file: string) =>
  (sheet: string) =>
  (err: string) =>
    `${file}.xlsx, Sheet "${sheet}": ${err}`

const wrapUnivCsvErr = wrapCsvErr ("univ")
const wrapL10nCsvErr = (locale: string) => wrapCsvErr (`${locale}/l10n`)

export type TableParseRes = Pair<L10nRecord, WikiModelRecord>

export const parseTables =
  (locale: string): ReduxAction<Promise<Either<string, TableParseRes>>> =>
  async dispatch => {
    traceId ("Parsing tables...")

    const l10n_path = path.join (app_path, "app", "Database", locale, "l10n.xlsx")

    const univ = await readXLSX (univ_path)
    const l10n = await readXLSX (l10n_path)

    try {
      return await dispatch (parseWorkbooks (locale) (univ) (l10n))
    }
    catch (e) {
      return Left (e .message)
    }
  }

const parseWorkbooks =
  (locale: string) =>
  (univ_wb: OrderedMap<string, string>) =>
  (l10n_wb: OrderedMap<string, string>):
  ReduxAction<Promise<Either<string, Pair<L10nRecord, WikiModelRecord>>>> =>
  async dispatch => {
    const euniv_map =
      mapMEitherWithKey ((k: string) => pipe (csvToList, first (wrapUnivCsvErr (k))))
                        (univ_wb)

    const el10n_map =
      mapMEitherWithKey ((k: string) => pipe (csvToList, first (wrapL10nCsvErr (locale) (k))))
                        (l10n_wb)

    if (isLeft (euniv_map)) {
      return euniv_map
    }

    if (isLeft (el10n_map)) {
      return el10n_map
    }

    const lookup_univ =
      (sheet: string) =>
        pipe_ (
          sheet,
          lookupF (fromRight_ (euniv_map)),
          maybeToEither (`univ.xlsx: "${sheet}" sheet not found.`)
        )

    const lookup_l10n =
      (sheet: string) =>
        pipe_ (
          sheet,
          lookupF (fromRight_ (el10n_map)),
          maybeToEither (`l10n.xlsx: "${sheet}" sheet not found.`)
        )

    const convertRecordNoRequiredFromSheet =
      lookupNoRequiredToRecordFromSheetLoading (lookup_l10n) (lookup_univ)

    const convertRecordL10nRequiredFromSheet =
      lookupL10nRequiredToRecordFromSheetLoading (lookup_l10n) (lookup_univ)

    const convertRecordL10nOnlyFromSheet =
      lookupL10nToRecordFromSheetLoading (lookup_l10n)

    const convertRecordFromSheet =
      lookupBothRequiredToRecordFromSheetLoading (lookup_l10n) (lookup_univ)

    const l10n = bind (lookup_l10n ("UI")) <L10nRecord> (toL10n (locale))

    const books = await dispatch (convertRecordL10nOnlyFromSheet (toBook) ("BOOKS") (2))

    const experienceLevels = await dispatch (convertRecordFromSheet (toExperienceLevel)
                                                                    ("EXPERIENCE_LEVELS")
                                                                    (3))

    const races = await dispatch (convertRecordFromSheet (toRace) ("RACES") (4))

    const raceVariants = await dispatch (convertRecordFromSheet (toRaceVariant)
                                                                ("RACE_VARIANTS")
                                                                (5))

    const cultures = await dispatch (convertRecordFromSheet (toCulture) ("CULTURES") (6))

    const professions = await dispatch (convertRecordFromSheet (toProfession) ("PROFESSIONS") (7))

    const professionVariants = await dispatch (convertRecordFromSheet (toProfessionVariant)
                                                                      ("PROFESSION_VARIANTS")
                                                                      (8))

    const attributes = await dispatch (convertRecordFromSheet (toAttribute) ("ATTRIBUTES") (9))

    const advantages = await dispatch (convertRecordFromSheet (toAdvantage) ("ADVANTAGES") (10))

    const advantageSelectOptions =
      await dispatch (convertRecordL10nRequiredFromSheet (toAdvantageSelectOption)
                                                         ("AdvantagesSelections")
                                                         (11))

    const disadvantages = await dispatch (convertRecordFromSheet (toDisadvantage)
                                                                 ("DISADVANTAGES")
                                                                 (12))

    const disadvantageSelectOptions =
      await dispatch (convertRecordL10nRequiredFromSheet (toDisadvantageSelectOption)
                                                         ("DisadvantagesSelections") (13))

    const skills = await dispatch (convertRecordFromSheet (toSkill) ("SKILLS") (14))

    const combatTechniques = await dispatch (convertRecordFromSheet (toCombatTechnique)
                                                                    ("COMBAT_TECHNIQUES")
                                                                    (15))

    const spells = await dispatch (convertRecordFromSheet (toSpell) ("SPELLS") (16))

    const spellExtensions = await dispatch (convertRecordNoRequiredFromSheet (toSpellExtension)
                                                                             ("SpellX")
                                                                             (17))

    const cantrips = await dispatch (convertRecordFromSheet (toCantrip) ("CANTRIPS") (18))

    const liturgicalChants = await dispatch (convertRecordFromSheet (toLiturgicalChant)
                                                                    ("CHANTS")
                                                                    (19))

    const liturgicalChantExtensions =
      await dispatch (convertRecordNoRequiredFromSheet (toLiturgicalChantExtension) ("ChantX") (20))

    const blessings = await dispatch (convertRecordFromSheet (toBlessing) ("BLESSINGS") (21))

    const specialAbilities = await dispatch (convertRecordFromSheet (toSpecialAbility)
                                                                    ("SPECIAL_ABILITIES")
                                                                    (22))

    const specialAbilitySelectOptions =
      await dispatch (convertRecordL10nRequiredFromSheet (toSpecialAbilitySelectOption)
                                                         ("SpecialAbilitiesSelections")
                                                         (23))

    const itemTemplates = await dispatch (convertRecordFromSheet (toItemTemplate)
                                                                 ("EQUIPMENT")
                                                                 (24))

    return mapMNamed
      ({
        l10n,
        books,
        experienceLevels,
        races,
        raceVariants,
        cultures,
        professions,
        professionVariants,
        attributes,
        advantages,
        advantageSelectOptions,
        disadvantages,
        disadvantageSelectOptions,
        skills,
        combatTechniques,
        spells,
        spellExtensions,
        cantrips,
        liturgicalChants,
        liturgicalChantExtensions,
        blessings,
        specialAbilities,
        specialAbilitySelectOptions,
        itemTemplates,
      })
      (rs =>
        trace ("Tables parsed")
              (Pair (
                rs.l10n,
                pipe_ (
                  WikiModel ({
                    books: rs.books,
                    experienceLevels: rs.experienceLevels,
                    races: rs.races,
                    raceVariants: rs.raceVariants,
                    cultures: rs.cultures,
                    professions: rs.professions,
                    professionVariants: rs.professionVariants,
                    attributes: rs.attributes,
                    advantages: rs.advantages,
                    disadvantages: rs.disadvantages,
                    specialAbilities: rs.specialAbilities,
                    skills: rs.skills,
                    combatTechniques: rs.combatTechniques,
                    spells: rs.spells,
                    cantrips: rs.cantrips,
                    liturgicalChants: rs.liturgicalChants,
                    blessings: rs.blessings,
                    itemTemplates: rs.itemTemplates,
                  }),
                  over (WikiModelL.professions)
                      (insert<string> (ProfessionId.CustomProfession)
                                      (getCustomProfession (rs.l10n))),
                  w => over (WikiModelL.advantages)
                            (pipe (
                              OrderedMap.map (over (AdvantageL.select)
                                                  (fmap (mapCatToSelectOptions (w)))),
                              matchSelectOptionsToBaseRecords (rs.advantageSelectOptions)
                            ))
                            (w),
                  w => over (WikiModelL.disadvantages)
                            (pipe (
                              OrderedMap.map (over (DisadvantageL.select)
                                                  (fmap (mapCatToSelectOptions (w)))),
                              matchSelectOptionsToBaseRecords (rs.disadvantageSelectOptions)
                            ))
                            (w),
                  w => {
                    const knowledge_skills =
                      mapMaybe (pipe (
                                ensure (pipe (Skill.A.gr, equals (4))),
                                fmap (x => SelectOption ({
                                              id: Skill.A.id (x),
                                              name: Skill.A.name (x),
                                              cost: Just (Skill.A.ic (x)),
                                              src: Skill.A.src (x),
                                            }))
                              ))
                              (elems (WikiModel.A.skills (w)))

                    const skills_with_apps =
                      map ((x: Record<Skill>) => SelectOption ({
                                                  id: Skill.A.id (x),
                                                  name: Skill.A.name (x),
                                                  cost: Just (Skill.A.ic (x)),
                                                  applications: Just (Skill.A.applications (x)),
                                                  applicationInput: Skill.A.applicationsInput (x),
                                                  src: Skill.A.src (x),
                                                }))
                          (elems (WikiModel.A.skills (w)))

                    return over (WikiModelL.specialAbilities)
                                (pipe (
                                  OrderedMap.map (x => {
                                    switch (SpecialAbility.A.id (x)) {
                                      case SpecialAbilityId.Forschungsgebiet:
                                      case SpecialAbilityId.Expertenwissen:
                                      case SpecialAbilityId.Wissensdurst:
                                      case SpecialAbilityId.Recherchegespuer: {
                                        return set (SpecialAbilityL.select)
                                                   (Just (knowledge_skills))
                                                   (x)
                                      }

                                      case SpecialAbilityId.SkillSpecialization: {
                                        return set (SpecialAbilityL.select)
                                                   (Just (skills_with_apps))
                                                   (x)
                                      }

                                      case SpecialAbilityId.TraditionGuildMages: {
                                        return over (SpecialAbilityL.select)
                                                    (fmap (mapCatToSelectOptionsPred
                                                            (noGuildMageSkill)
                                                            (w)))
                                                    (x)
                                      }

                                      default:
                                        return over (SpecialAbilityL.select)
                                                    (fmap (mapCatToSelectOptions (w)))
                                                    (x)
                                    }
                                  }),
                                  matchSelectOptionsToBaseRecords (rs.specialAbilitySelectOptions),
                                  matchExtensionsToBaseRecord (rs.spellExtensions)
                                                              (SpecialAbilityId.SpellExtensions),
                                  matchExtensionsToBaseRecord (rs.liturgicalChantExtensions)
                                                              (SpecialAbilityId.ChantExtensions)
                                ))
                                (w)
                  }
                )
              )))
  }

const mapCatToSelectOptions =
  (wiki: WikiModelRecord) =>
    foldr ((x: Record<SelectOption>) => {
            const cat = (SelectOption.A.id as (x: Record<SelectOption>) => Categories) (x)

            return pipe_ (
              cat,
              getWikiSliceGetterByCategory as
                (c: Categories) =>
                  (x: Record<WikiModel>) => OrderedMap<string, Skillish>,
              thrush (wiki),
              elems,
              cat === Categories.SPELLS
                ? mapMaybe (pipe (
                    ensure<Skillish> (pipe (Skill.AL.gr, lt (3))),
                    fmap (skillishToSelectOption)
                  ))
                : map (skillishToSelectOption),
              append
            )
          })
          (List ())

const skillishToSelectOption =
  (r: Skillish) =>
    SelectOption ({
      id: Skill.AL.id (r),
      name: Skill.AL.name (r),
      cost: member ("ic") (r) ? Just (Skill.AL.ic (r)) : Nothing,
      src: Skill.AL.src (r),
    })

const mapCatToSelectOptionsPred =
  (pred: (x: Skillish) => boolean) =>
  (wiki: WikiModelRecord) =>
    foldr (pipe (
              SelectOption.A.id as (x: Record<SelectOption>) => Categories,
              getWikiSliceGetterByCategory as
                (c: Categories) =>
                  (x: Record<WikiModel>) => OrderedMap<string, Skillish>,
              thrush (wiki),
              elems,
              mapMaybe (pipe (
                ensure (pred),
                fmap (r => SelectOption ({
                  id: Skill.AL.id (r),
                  name: Skill.AL.name (r),
                  cost: member ("ic") (r) ? Just (Skill.AL.ic (r)) : Nothing,
                  src: Skill.AL.src (r),
                }))
              )),
              append
            ))
            (List ())

const noGuildMageSkill = (x: Skillish) => Spell.is (x)
                                          && all (notElemF (List (1, 2)))
                                                 (Spell.A.tradition (x))
                                          && elemF (List (1, 2)) (Spell.A.gr (x))
