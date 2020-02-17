import { equals } from "../../Data/Eq"
import { flip, ident } from "../../Data/Function"
import { fmap, fmapF } from "../../Data/Functor"
import { any, consF, filter, filterMulti, find, foldr, intercalate, List, map, notElemF, nub } from "../../Data/List"
import { bindF, elemF, ensure, fromMaybe, joinMaybeList, Just, liftM2, liftM3, listToMaybe, mapMaybe, Maybe, Nothing } from "../../Data/Maybe"
import { insert, lookup, OrderedMap } from "../../Data/OrderedMap"
import { member, OrderedSet } from "../../Data/OrderedSet"
import { Record } from "../../Data/Record"
import { fst, Pair, snd, Tuple } from "../../Data/Tuple"
import { uncurryN, uncurryN3 } from "../../Data/Tuple/Curry"
import { ActivatableCategory, Category } from "../Constants/Categories"
import { AdvantageId, DisadvantageId, SpecialAbilityId } from "../Constants/Ids"
import { ActivatableDependent } from "../Models/ActiveEntries/ActivatableDependent"
import { ActiveObject } from "../Models/ActiveEntries/ActiveObject"
import { ActiveObjectWithId } from "../Models/ActiveEntries/ActiveObjectWithId"
import { EntryRating } from "../Models/Hero/heroTypeHelpers"
import { ActivatableActivationValidation } from "../Models/View/ActivatableActivationValidationObject"
import { ActivatableCombinedName } from "../Models/View/ActivatableCombinedName"
import { ActivatableNameCost } from "../Models/View/ActivatableNameCost"
import { ActiveActivatable, ActiveActivatableA_ } from "../Models/View/ActiveActivatable"
import { Advantage } from "../Models/Wiki/Advantage"
import { Culture } from "../Models/Wiki/Culture"
import { Disadvantage } from "../Models/Wiki/Disadvantage"
import { Profession } from "../Models/Wiki/Profession"
import { Race } from "../Models/Wiki/Race"
import { SpecialAbility } from "../Models/Wiki/SpecialAbility"
import { SelectOption } from "../Models/Wiki/sub/SelectOption"
import { StaticDataRecord } from "../Models/Wiki/WikiModel"
import { heroReducer } from "../Reducers/heroReducer"
import { getAllActiveByCategory } from "../Utilities/Activatable/activatableActiveUtils"
import { modifyByLevel } from "../Utilities/Activatable/activatableModifierUtils"
import { getBracketedNameFromFullName } from "../Utilities/Activatable/activatableNameUtils"
import { isMaybeActive } from "../Utilities/Activatable/isActive"
import { getActiveSelections, getSelectOptionName } from "../Utilities/Activatable/selectionUtils"
import { createMapSelectorP } from "../Utilities/createMapSelector"
import { createMaybeSelector } from "../Utilities/createMaybeSelector"
import { filterAndSortRecordsBy } from "../Utilities/filterAndSortBy"
import { compareLocale } from "../Utilities/I18n"
import { pipe, pipe_ } from "../Utilities/pipe"
import { mapCurrentHero, mapGetToMaybeSlice, mapGetToSlice } from "../Utilities/SelectorsUtils"
import { blessedSpecialAbilityGroups, combatSpecialAbilityGroups, generalSpecialAbilityGroups, magicalSpecialAbilityGroups } from "../Utilities/sheetUtils"
import { comparingR, sortStrings } from "../Utilities/sortBy"
import { misNumberM, misStringM } from "../Utilities/typeCheckUtils"
import { getBlessedTraditionFromWikiState } from "./liturgicalChantsSelectors"
import { getAutomaticAdvantages, getCurrentCulture, getCurrentProfession, getRace } from "./rcpSelectors"
import { getSpecialAbilitiesSortOptions } from "./sortOptionsSelectors"
import { getMagicalTraditionsFromWiki } from "./spellsSelectors"
import { getAdvantages, getAdvantagesFilterText, getCultureAreaKnowledge, getCurrentHeroPresent, getDisadvantages, getDisadvantagesFilterText, getHeroes, getSpecialAbilities, getSpecialAbilitiesFilterText, getWiki, getWikiSpecialAbilities } from "./stateSelectors"

const AAA_ = ActiveActivatableA_
const SAA = SpecialAbility.A
const ADA = ActivatableDependent.A
const AOA = ActiveObject.A
const SOA = SelectOption.A

const getSelectOptions = pipe (bindF (SAA.select), joinMaybeList)
const mapActiveObjects =
  (sos: List<Record<SelectOption>>) =>
    pipe (
      fmap (ADA.active) as
        (m: Maybe<Record<ActivatableDependent>>) => Maybe<List<Record<ActiveObject>>>,
      joinMaybeList,
      mapMaybe (pipe (AOA.sid, sid => find (pipe (SOA.id, elemF (sid))) (sos)))
    )

export const getActiveScriptsAndLanguages = createMaybeSelector (
  mapGetToSlice (getSpecialAbilities) (SpecialAbilityId.Literacy),
  mapGetToSlice (getWikiSpecialAbilities) (SpecialAbilityId.Literacy),
  mapGetToSlice (getSpecialAbilities) (SpecialAbilityId.Language),
  mapGetToSlice (getWikiSpecialAbilities) (SpecialAbilityId.Language),
  (mscripts_hero, scripts_wiki, mlanguages_hero, languages_wiki) => {
    const scripts = getSelectOptions (scripts_wiki)
    const languages = getSelectOptions (languages_wiki)

    const active_scripts = mapActiveObjects (scripts) (mscripts_hero)
    const active_languages = mapActiveObjects (languages) (mlanguages_hero)

    return Pair (active_scripts, active_languages)
  }
)

export const getScriptsWithMatchingLanguages = createMaybeSelector (
  getActiveScriptsAndLanguages,
  p => {
    const active_scripts = fst (p)
    const active_languages = snd (p)

    return mapMaybe (pipe (
                      ensure (pipe (
                        SOA.languages,
                        joinMaybeList,
                        any (id => any (pipe (SOA.id, equals<string | number> (id)))
                                       (active_languages))
                      )),
                      fmap (SOA.id),
                      misNumberM
                    ))
                    (active_scripts)
  }
)

export const getLanguagesWithMatchingScripts = createMaybeSelector (
  getActiveScriptsAndLanguages,
  p => {
    const active_scripts = fst (p)
    const active_languages = snd (p)

    return nub (mapMaybe (pipe (
                           SOA.languages,
                           joinMaybeList,
                           find (id => any (pipe (SOA.id, equals<string | number> (id)))
                                           (active_languages))
                         ))
                         (active_scripts))
  }
)

export const isEntryRequiringMatchingScriptAndLangActive = createMaybeSelector (
  getSpecialAbilities,
  pipe (
    lookup<string> (SpecialAbilityId.WegDerSchreiberin),
    isMaybeActive
  )
)

export const getMatchingScriptAndLangRelated = createMaybeSelector (
  isEntryRequiringMatchingScriptAndLangActive,
  getScriptsWithMatchingLanguages,
  getLanguagesWithMatchingScripts,

  // tslint:disable-next-line: no-unnecessary-callback-wrapper
  (is, scripts, langs) => Tuple (is, scripts, langs)
)

export const getActive = <T extends ActivatableCategory>(category: T, addLevelToName: boolean) =>
  createMaybeSelector (
    getWiki,
    getCurrentHeroPresent,
    getAutomaticAdvantages,
    getMatchingScriptAndLangRelated,
    (staticData, mhero, automatic_advantages, matching_script_and_lang_related) =>
      fmapF (mhero) (getAllActiveByCategory (category)
                                            (addLevelToName)
                                            (automatic_advantages)
                                            (matching_script_and_lang_related)
                                            (staticData))
  )

export const getActiveMap =
  (addLevelToName: boolean) =>
  <T extends ActivatableCategory>
  (category: T) =>
    createMapSelectorP (getHeroes)
                       (
                         getWiki,
                         getAutomaticAdvantages,
                         getMatchingScriptAndLangRelated
                       )
                       (heroReducer.A.present)
                       ((staticData, automatic_advantages, matching_script_and_lang_related) =>
                         getAllActiveByCategory (category)
                                                (addLevelToName)
                                                (automatic_advantages)
                                                (matching_script_and_lang_related)
                                                (staticData))

export const getActiveForView = <T extends ActivatableCategory>(category: T) =>
  getActive (category, true)

export const getActiveForEditView = <T extends ActivatableCategory>(category: T) =>
  getActive (category, false)

export const getActiveForViewMap = getActiveMap (true)

type RatingMap = OrderedMap<string, EntryRating>

const insertRating = flip (insert as insert<string, EntryRating>)

export const getAdvantagesRating = createMaybeSelector (
  getRace,
  getCurrentCulture,
  getCurrentProfession,
  (mrace, mculture, mprofession) =>
    liftM3 ((r: Record<Race>) => (c: Record<Culture>) => (p: Record<Profession>) =>
             pipe_ (
               OrderedMap.empty as RatingMap,

               flip (foldr (insertRating (EntryRating.Common)))
                    (Race.A.commonAdvantages (r)),

               flip (foldr (insertRating (EntryRating.Uncommon)))
                    (Race.A.uncommonAdvantages (r)),

               flip (foldr (insertRating (EntryRating.Common)))
                    (Culture.A.commonAdvantages (c)),

               flip (foldr (insertRating (EntryRating.Uncommon)))
                    (Culture.A.uncommonAdvantages (c)),

               flip (foldr (insertRating (EntryRating.Common)))
                    (Profession.A.suggestedAdvantages (p)),

               flip (foldr (insertRating (EntryRating.Uncommon)))
                    (Profession.A.unsuitableAdvantages (p)),

               flip (foldr (insertRating (EntryRating.Essential)))
                    (Race.A.stronglyRecommendedAdvantages (r))
             ))
           (mrace)
           (mculture)
           (mprofession)
)

export const getDisadvantagesRating = createMaybeSelector (
  getRace,
  getCurrentCulture,
  getCurrentProfession,
  (mrace, mculture, mprofession) =>
    liftM3 ((r: Record<Race>) => (c: Record<Culture>) => (p: Record<Profession>) =>
             pipe_ (
               OrderedMap.empty as RatingMap,

               flip (foldr (insertRating (EntryRating.Common)))
                    (Race.A.commonDisadvantages (r)),

               flip (foldr (insertRating (EntryRating.Uncommon)))
                    (Race.A.uncommonDisadvantages (r)),

               flip (foldr (insertRating (EntryRating.Common)))
                    (Culture.A.commonDisadvantages (c)),

               flip (foldr (insertRating (EntryRating.Uncommon)))
                    (Culture.A.uncommonDisadvantages (c)),

               flip (foldr (insertRating (EntryRating.Common)))
                    (Profession.A.suggestedDisadvantages (p)),

               flip (foldr (insertRating (EntryRating.Uncommon)))
                    (Profession.A.unsuitableDisadvantages (p)),

               flip (foldr (insertRating (EntryRating.Essential)))
                    (Race.A.stronglyRecommendedDisadvantages (r))
             ))
           (mrace)
           (mculture)
           (mprofession)
)

export const getAdvantagesForSheet = createMaybeSelector (
  getActiveForView (Category.ADVANTAGES),
  ident
)

export const getAdvantagesForEditMap = getActiveForViewMap (Category.ADVANTAGES)

export const getAdvantagesForEdit = mapCurrentHero (getAdvantagesForEditMap)

export const getFilteredActiveAdvantages = createMaybeSelector (
  getAdvantagesForEdit,
  getAdvantagesFilterText,
  getWiki,
  (madvantages, filterText, staticData) =>
    fmapF (madvantages)
          (filterAndSortRecordsBy (0)
                                  <Record<ActiveActivatable<Advantage>>>
                                  ([ ActiveActivatableA_.name ])
                                  ([ comparingR (ActiveActivatableA_.name)
                                                (compareLocale (staticData)) ])
                                  (filterText))
)

export const getDisadvantagesForSheet = createMaybeSelector (
  getActiveForView (Category.DISADVANTAGES),
  ident
)

export const getDisadvantagesForEditMap = getActiveForViewMap (Category.DISADVANTAGES)

export const getDisadvantagesForEdit = mapCurrentHero (getDisadvantagesForEditMap)

export const getFilteredActiveDisadvantages = createMaybeSelector (
  getDisadvantagesForEdit,
  getDisadvantagesFilterText,
  getWiki,
  (mdisadvantages, filterText, staticData) =>
    fmapF (mdisadvantages)
          (filterAndSortRecordsBy (0)
                                  <Record<ActiveActivatable<Disadvantage>>>
                                  ([ ActiveActivatableA_.name ])
                                  ([ comparingR (ActiveActivatableA_.name)
                                                (compareLocale (staticData)) ])
                                  (filterText))
)

export const getSpecialAbilitiesForSheet = createMaybeSelector (
  getActiveForView (Category.SPECIAL_ABILITIES),
  ident
)

export const getSpecialAbilitiesForEditMap = getActiveForViewMap (Category.SPECIAL_ABILITIES)

export const getSpecialAbilitiesForEdit = mapCurrentHero (getSpecialAbilitiesForEditMap)

export const getFilteredActiveSpecialAbilities = createMaybeSelector (
  getSpecialAbilitiesForEdit,
  getSpecialAbilitiesSortOptions,
  getSpecialAbilitiesFilterText,
  (mspecial_abilities, sortOptions, filterText) =>
    fmapF (mspecial_abilities)
          (filterAndSortRecordsBy (0)
                                  <Record<ActiveActivatable<SpecialAbility>>>
                                  ([ AAA_.name, pipe (AAA_.nameInWiki, fromMaybe ("")) ])
                                  (sortOptions)
                                  (filterText))
)

export const getGeneralSpecialAbilitiesForSheet = createMaybeSelector (
  getWikiSpecialAbilities,
  getSpecialAbilitiesForSheet,
  getCultureAreaKnowledge,
  (wiki_special_abilities, mspecial_abilities, culture_area_knowledge_text) =>
    liftM2 ((culture_area_knowledge: Record<SpecialAbility>) =>
            (special_abilities: List<Record<ActiveActivatable<SpecialAbility>>>) =>
              pipe_ (
                special_abilities,
                filterMulti<Record<ActiveActivatable<SpecialAbility>>>
                  (List (
                    pipe (
                      ActiveActivatable.A.wikiEntry,
                      SpecialAbility.AL.gr,
                      flip (member) (generalSpecialAbilityGroups)
                    ),
                    pipe (
                      ActiveActivatable.A.wikiEntry,
                      SpecialAbility.AL.id,
                      notElemF (List<string> (SpecialAbilityId.Literacy, SpecialAbilityId.Language))
                    )
                  )),
                consF (ActiveActivatable ({
                        nameAndCost: ActivatableNameCost ({
                          active: ActiveObjectWithId ({
                            id: SpecialAbility.A.id (culture_area_knowledge),
                            sid: Nothing,
                            sid2: Nothing,
                            tier: Nothing,
                            cost: Nothing,
                            index: Nothing,
                          }),
                          finalCost: 0,
                          naming: ActivatableCombinedName ({
                            name:
                              `${SpecialAbility.A.name (culture_area_knowledge)}`
                              + ` (${fromMaybe ("") (culture_area_knowledge_text)})`,
                            baseName: SpecialAbility.A.name (culture_area_knowledge),
                            addName: culture_area_knowledge_text,
                          }),
                          isAutomatic: false,
                        }),
                        validation: ActivatableActivationValidation ({
                          disabled: true,
                          maxLevel: Nothing,
                          minLevel: Nothing,
                        }),
                        heroEntry: ActivatableDependent.default,
                        wikiEntry: SpecialAbility.default,
                      }) as Record<ActiveActivatable<SpecialAbility>>)
              ))
           (lookup<string> (SpecialAbilityId.AreaKnowledge)
                           (wiki_special_abilities))
           (mspecial_abilities)
)

const getSpecialAbilitiesByGroups =
  (grs: OrderedSet<number>) =>
    fmap (filter (pipe (
      ActiveActivatable.A.wikiEntry,
      SpecialAbility.AL.gr,
      flip (member) (grs)
    ))) as ident<Maybe<List<Record<ActiveActivatable<SpecialAbility>>>>>

export const getCombatSpecialAbilitiesForSheet = createMaybeSelector (
  getSpecialAbilitiesForSheet,
  getSpecialAbilitiesByGroups (combatSpecialAbilityGroups)
)

export const getMagicalSpecialAbilitiesForSheet = createMaybeSelector (
  getSpecialAbilitiesForSheet,
  getSpecialAbilitiesByGroups (magicalSpecialAbilityGroups)
)

export const getBlessedSpecialAbilitiesForSheet = createMaybeSelector (
  getSpecialAbilitiesForSheet,
  getSpecialAbilitiesByGroups (blessedSpecialAbilityGroups)
)

export const getFatePointsModifier = createMaybeSelector (
  mapGetToMaybeSlice (getAdvantages) (AdvantageId.Luck),
  mapGetToMaybeSlice (getDisadvantages) (DisadvantageId.BadLuck),
  uncurryN (modifyByLevel (0))
)

export const getMagicalTraditionForSheet = createMaybeSelector (
  getMagicalTraditionsFromWiki,
  pipe (
    map (pipe (SpecialAbility.A.name, getBracketedNameFromFullName)),
    intercalate (", ")
  )
)

export const getBlessedTraditionForSheet = createMaybeSelector (
  getBlessedTraditionFromWikiState,
  fmap (pipe (SpecialAbility.A.name, getBracketedNameFromFullName))
)

const getPropertyOrAspectKnowledgesForSheet =
  uncurryN3 ((staticData: StaticDataRecord) => liftM2 ((wiki_entry: Record<SpecialAbility>) =>
                                                        pipe (
                                                          getActiveSelections,
                                                          mapMaybe (pipe (
                                                            Just,
                                                            getSelectOptionName (wiki_entry)
                                                          )),
                                                          sortStrings (staticData),
                                                          intercalate (", ")
                                                        )))

export const getPropertyKnowledgesForSheet = createMaybeSelector (
  getWiki,
  mapGetToSlice (getWikiSpecialAbilities) (SpecialAbilityId.PropertyKnowledge),
  mapGetToSlice (getSpecialAbilities) (SpecialAbilityId.PropertyKnowledge),
  getPropertyOrAspectKnowledgesForSheet
)

export const getAspectKnowledgesForSheet = createMaybeSelector (
  getWiki,
  mapGetToSlice (getWikiSpecialAbilities) (SpecialAbilityId.AspectKnowledge),
  mapGetToSlice (getSpecialAbilities) (SpecialAbilityId.AspectKnowledge),
  getPropertyOrAspectKnowledgesForSheet
)

export const getInitialStartingWealth = createMaybeSelector (
  mapGetToMaybeSlice (getAdvantages) (AdvantageId.Rich),
  mapGetToMaybeSlice (getDisadvantages) (DisadvantageId.Poor),
  (rich, poor) => modifyByLevel (0) (rich) (poor) * 250 + 750
)

export const getGuildMageUnfamiliarSpellId = createMaybeSelector (
  mapGetToSlice (getSpecialAbilities) (SpecialAbilityId.TraditionGuildMages),
  pipe (
    bindF (pipe (ActivatableDependent.A.active, listToMaybe)),
    fmap (pipe (ActiveObject.A.sid, misStringM))
  )
)
