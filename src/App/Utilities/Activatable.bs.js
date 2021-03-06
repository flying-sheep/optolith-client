// Generated by BUCKLESCRIPT, PLEASE EDIT WITH CARE
'use strict';

var Block = require("bs-platform/lib/js/block.js");
var Curry = require("bs-platform/lib/js/curry.js");
var Ids$OptolithClient = require("../Constants/Ids.bs.js");
var Intl$OptolithClient = require("./Intl.bs.js");
var ListH$OptolithClient = require("../../Data/ListH.bs.js");
var Maybe$OptolithClient = require("../../Data/Maybe.bs.js");
var IntMap$OptolithClient = require("../../Data/IntMap.bs.js");
var Function$OptolithClient = require("../../Data/Function.bs.js");
var Integers$OptolithClient = require("./Integers.bs.js");
var AdvancedFiltering$OptolithClient = require("./AdvancedFiltering.bs.js");
var Static_SelectOption$OptolithClient = require("../Models/Static_SelectOption.bs.js");

function isActive(x) {
  return ListH$OptolithClient.Extra.notNull(x.active);
}

function isActiveM(param) {
  return Maybe$OptolithClient.maybe(false, isActive, param);
}

function heroEntryToSingles(x) {
  return ListH$OptolithClient.map((function (s) {
                return {
                        id: x.id,
                        options: s.options,
                        level: s.level,
                        customCost: s.customCost
                      };
              }), x.active);
}

function activatableOptionToSelectOptionId(id) {
  if (id[0] >= 931971705) {
    return /* Nothing */0;
  } else {
    return /* Just */[id];
  }
}

var Convert = {
  heroEntryToSingles: heroEntryToSingles,
  activatableOptionToSelectOptionId: activatableOptionToSelectOptionId
};

function name(x) {
  return x[0].name;
}

function selectOptions(x) {
  switch (x.tag | 0) {
    case /* Advantage */0 :
    case /* Disadvantage */1 :
        return x[0].selectOptions;
    case /* SpecialAbility */2 :
        return x[0].selectOptions;
    
  }
}

function input(x) {
  switch (x.tag | 0) {
    case /* Advantage */0 :
    case /* Disadvantage */1 :
        return x[0].input;
    case /* SpecialAbility */2 :
        return x[0].input;
    
  }
}

function apValue(x) {
  switch (x.tag | 0) {
    case /* Advantage */0 :
    case /* Disadvantage */1 :
        return x[0].apValue;
    case /* SpecialAbility */2 :
        return x[0].apValue;
    
  }
}

var Accessors = {
  name: name,
  selectOptions: selectOptions,
  input: input,
  apValue: apValue
};

function getSelectOption(x, id) {
  var partial_arg = selectOptions(x);
  return Maybe$OptolithClient.Monad.$great$great$eq(activatableOptionToSelectOptionId(id), (function (param) {
                return Function$OptolithClient.flip(Static_SelectOption$OptolithClient.SelectOptionMap.lookup, partial_arg, param);
              }));
}

function getSelectOptionName(x, id) {
  return Maybe$OptolithClient.Functor.$less$amp$great(getSelectOption(x, id), (function (y) {
                return y.name;
              }));
}

function getSelectOptionCost(x, id) {
  return Maybe$OptolithClient.Monad.$great$great$eq(getSelectOption(x, id), (function (y) {
                return y.cost;
              }));
}

function getActiveSelections(x) {
  return Maybe$OptolithClient.mapMaybe((function (y) {
                return Maybe$OptolithClient.listToMaybe(y.options);
              }), x.active);
}

var SelectOptions = {
  getSelectOption: getSelectOption,
  getSelectOptionName: getSelectOptionName,
  getSelectOptionCost: getSelectOptionCost,
  getActiveSelections: getActiveSelections
};

function getCustomInput(option) {
  if (option[0] >= 931971705) {
    return /* Just */[option[1]];
  } else {
    return /* Nothing */0;
  }
}

function getGenericId(option) {
  if (option[0] !== 61643255) {
    return /* Nothing */0;
  } else {
    return /* Just */[option[1]];
  }
}

function lookupMap(k, mp, f) {
  return Maybe$OptolithClient.Functor.$less$$great(f, Curry._2(IntMap$OptolithClient.lookup, k, mp));
}

function getSkillFromOption(staticData, option) {
  if (option[0] !== 290194801) {
    return /* Nothing */0;
  } else {
    return Curry._2(IntMap$OptolithClient.lookup, option[1], staticData.skills);
  }
}

function getDefaultNameAddition(staticEntry, heroEntry) {
  var input$1 = input(staticEntry);
  var selectOptions$1 = selectOptions(staticEntry);
  var sid = Maybe$OptolithClient.listToMaybe(heroEntry.options);
  var sid2 = ListH$OptolithClient.$less$bang$bang$great(heroEntry.options, 1);
  if (input$1) {
    if (sid) {
      var match = sid[0];
      if (match[0] >= 931971705) {
        if (sid2) {
          return /* Nothing */0;
        } else {
          return /* Just */[match[1]];
        }
      } else if (sid2) {
        var match$1 = sid2[0];
        if (typeof match$1 === "number" || match$1[0] !== 931971705 || Curry._1(Static_SelectOption$OptolithClient.SelectOptionMap.size, selectOptions$1) <= 0) {
          return /* Nothing */0;
        } else {
          return /* Just */[Maybe$OptolithClient.fromMaybe("", getSelectOptionName(staticEntry, match)) + (": " + match$1[1])];
        }
      } else {
        return /* Nothing */0;
      }
    } else {
      return /* Nothing */0;
    }
  } else if (sid) {
    var match$2 = sid[0];
    if (typeof match$2 === "number") {
      return /* Nothing */0;
    } else {
      var variant = match$2[0];
      if (variant >= 61643255) {
        if (variant >= 345443720) {
          if (variant !== 797131559 && variant >= 345443721) {
            return /* Nothing */0;
          }
          
        } else if (variant !== 290194801 && variant >= 61643256) {
          return /* Nothing */0;
        }
        
      } else if (variant !== -920806756 && variant !== -841776939 && variant !== -384382742) {
        return /* Nothing */0;
      }
      if (sid2) {
        return /* Nothing */0;
      } else {
        return getSelectOptionName(staticEntry, match$2);
      }
    }
  } else {
    return /* Nothing */0;
  }
}

function getEntrySpecificNameAddition(staticData, staticEntry, heroEntry) {
  switch (staticEntry.tag | 0) {
    case /* Advantage */0 :
        var match = Ids$OptolithClient.AdvantageId.fromInt(staticEntry[0].id);
        var exit = 0;
        if (typeof match === "number" && match < 22) {
          switch (match) {
            case /* Aptitude */0 :
            case /* ExceptionalSkill */4 :
                exit = 1;
                break;
            case /* ExceptionalCombatTechnique */5 :
            case /* WeaponAptitude */17 :
                exit = 2;
                break;
            case /* Nimble */1 :
            case /* Blessed */2 :
            case /* Luck */3 :
            case /* IncreasedAstralPower */6 :
            case /* IncreasedKarmaPoints */7 :
            case /* IncreasedLifePoints */8 :
            case /* IncreasedSpirit */9 :
            case /* IncreasedToughness */10 :
            case /* ImmunityToPoison */11 :
            case /* ImmunityToDisease */12 :
            case /* MagicalAttunement */13 :
            case /* Rich */14 :
            case /* SociallyAdaptable */15 :
            case /* InspireConfidence */16 :
            case /* Spellcaster */18 :
            case /* Unyielding */19 :
            case /* LargeSpellSelection */20 :
                return getDefaultNameAddition(staticEntry, heroEntry);
            case /* HatredFor */21 :
                return Maybe$OptolithClient.Monad.liftM2((function (type_, frequency) {
                              return type_ + (" (" + (frequency.name + ")"));
                            }), Maybe$OptolithClient.Monad.$great$great$eq(ListH$OptolithClient.$less$bang$bang$great(heroEntry.options, 1), getCustomInput), Maybe$OptolithClient.Monad.$great$great$eq(Maybe$OptolithClient.listToMaybe(heroEntry.options), (function (param) {
                                  return getSelectOption(staticEntry, param);
                                })));
            
          }
        } else {
          return getDefaultNameAddition(staticEntry, heroEntry);
        }
        switch (exit) {
          case 1 :
              return Maybe$OptolithClient.Monad.$great$great$eq(Maybe$OptolithClient.listToMaybe(heroEntry.options), (function (sid) {
                            var variant = sid[0];
                            if (variant !== -384382742) {
                              if (variant !== 290194801) {
                                if (variant !== 345443720) {
                                  return /* Nothing */0;
                                } else {
                                  return lookupMap(sid[1], staticData.spells, (function (x) {
                                                return x.name;
                                              }));
                                }
                              } else {
                                return lookupMap(sid[1], staticData.skills, (function (x) {
                                              return x.name;
                                            }));
                              }
                            } else {
                              return lookupMap(sid[1], staticData.liturgicalChants, (function (x) {
                                            return x.name;
                                          }));
                            }
                          }));
          case 2 :
              return Maybe$OptolithClient.Monad.$great$great$eq(Maybe$OptolithClient.listToMaybe(heroEntry.options), (function (sid) {
                            if (sid[0] >= -841776939) {
                              return /* Nothing */0;
                            } else {
                              return lookupMap(sid[1], staticData.combatTechniques, (function (x) {
                                            return x.name;
                                          }));
                            }
                          }));
          
        }
        break;
    case /* Disadvantage */1 :
        var match$1 = Ids$OptolithClient.DisadvantageId.fromInt(staticEntry[0].id);
        if (typeof match$1 === "number") {
          if (match$1 !== 12) {
            if (match$1 !== 18) {
              return getDefaultNameAddition(staticEntry, heroEntry);
            } else {
              return Maybe$OptolithClient.Functor.$less$amp$great(Maybe$OptolithClient.Monad.$great$great$eq(Maybe$OptolithClient.listToMaybe(heroEntry.options), (function (param) {
                                return getSkillFromOption(staticData, param);
                              })), (function (x) {
                            return x.name;
                          }));
            }
          } else {
            return Maybe$OptolithClient.Functor.$less$amp$great(Maybe$OptolithClient.Monad.$great$great$eq(Maybe$OptolithClient.listToMaybe(heroEntry.options), (function (param) {
                              return getSelectOption(staticEntry, param);
                            })), (function (option1) {
                          var match = option1.id;
                          return Maybe$OptolithClient.maybe(option1.name, (function (specialInput) {
                                        return option1.name + (": " + specialInput);
                                      }), match[0] !== 61643255 || (match[1] - 7 >>> 0) > 1 ? /* Nothing */0 : Maybe$OptolithClient.Monad.$great$great$eq(ListH$OptolithClient.$less$bang$bang$great(heroEntry.options, 1), getCustomInput));
                        }));
          }
        } else {
          return getDefaultNameAddition(staticEntry, heroEntry);
        }
    case /* SpecialAbility */2 :
        var match$2 = Ids$OptolithClient.SpecialAbilityId.fromInt(staticEntry[0].id);
        var exit$1 = 0;
        if (typeof match$2 === "number") {
          if (match$2 >= 71) {
            if (match$2 !== 85) {
              if (match$2 >= 72) {
                return getDefaultNameAddition(staticEntry, heroEntry);
              } else {
                return Maybe$OptolithClient.Monad.$great$great$eq(Maybe$OptolithClient.Monad.join(Maybe$OptolithClient.Monad.liftM2(getSelectOption, Maybe$OptolithClient.Functor.$less$amp$great(Curry._2(IntMap$OptolithClient.lookup, Ids$OptolithClient.SpecialAbilityId.toInt(/* Language */6), staticData.specialAbilities), (function (specialAbility) {
                                          return /* SpecialAbility */Block.__(2, [specialAbility]);
                                        })), Maybe$OptolithClient.listToMaybe(heroEntry.options))), (function (language) {
                              return Maybe$OptolithClient.Monad.$great$great$eq(ListH$OptolithClient.$less$bang$bang$great(heroEntry.options, 1), (function (option2) {
                                            var variant = option2[0];
                                            var tmp;
                                            if (variant !== 61643255) {
                                              tmp = variant >= 931971705 ? /* Just */[option2[1]] : /* Nothing */0;
                                            } else {
                                              var specializationId = option2[1];
                                              tmp = Maybe$OptolithClient.Monad.$great$great$eq(language.specializations, (function (specializations) {
                                                      return ListH$OptolithClient.$less$bang$bang$great(specializations, specializationId - 1 | 0);
                                                    }));
                                            }
                                            return Maybe$OptolithClient.Functor.$less$amp$great(tmp, (function (specialization) {
                                                          return language.name + (": " + specialization);
                                                        }));
                                          }));
                            }));
              }
            } else {
              return Maybe$OptolithClient.Monad.$great$great$eq(Maybe$OptolithClient.Monad.$great$great$eq(Maybe$OptolithClient.listToMaybe(heroEntry.options), (function (param) {
                                return getSkillFromOption(staticData, param);
                              })), (function (skill) {
                            var applications = Curry._2(IntMap$OptolithClient.filter, (function (app) {
                                    return Maybe$OptolithClient.isNothing(app.prerequisite);
                                  }), skill.applications);
                            return Maybe$OptolithClient.Functor.$less$amp$great(Maybe$OptolithClient.ensure((function (apps) {
                                              return 2 === ListH$OptolithClient.Foldable.length(apps);
                                            }), Maybe$OptolithClient.mapMaybe((function (option) {
                                                  return Maybe$OptolithClient.Monad.$great$great$eq(Maybe$OptolithClient.Monad.$great$great$eq(option, getGenericId), (function (opt) {
                                                                return Maybe$OptolithClient.Functor.$less$amp$great(Curry._2(IntMap$OptolithClient.Foldable.find, (function (app) {
                                                                                  return app.id === opt;
                                                                                }), applications), (function (app) {
                                                                              return app.name;
                                                                            }));
                                                              }));
                                                }), /* :: */[
                                                ListH$OptolithClient.$less$bang$bang$great(heroEntry.options, 1),
                                                /* :: */[
                                                  ListH$OptolithClient.$less$bang$bang$great(heroEntry.options, 2),
                                                  /* [] */0
                                                ]
                                              ])), (function (apps) {
                                          var appsStr = Intl$OptolithClient.ListFormat.format(/* Conjunction */0, staticData, AdvancedFiltering$OptolithClient.sortStrings(staticData, apps));
                                          return skill.name + (": " + appsStr);
                                        }));
                          }));
            }
          } else if (match$2 >= 16) {
            if (match$2 >= 53) {
              return getDefaultNameAddition(staticEntry, heroEntry);
            } else {
              switch (match$2 - 16 | 0) {
                case /* TerrainKnowledge */1 :
                    var match$3 = heroEntry.level;
                    if (match$3 && match$3[0] === 1) {
                      return Maybe$OptolithClient.Monad.$great$great$eq(Maybe$OptolithClient.listToMaybe(heroEntry.options), (function (param) {
                                    return getSelectOptionName(staticEntry, param);
                                  }));
                    } else {
                      return /* Nothing */0;
                    }
                case /* SkillSpecialization */0 :
                case /* CraftInstruments */2 :
                    exit$1 = 1;
                    break;
                case /* SpellEnhancement */25 :
                    return Maybe$OptolithClient.Monad.$great$great$eq(Maybe$OptolithClient.listToMaybe(heroEntry.options), (function (sid) {
                                  if (sid[0] !== -384382742) {
                                    return /* Nothing */0;
                                  } else {
                                    return lookupMap(sid[1], staticData.liturgicalChants, (function (x) {
                                                  return x.name;
                                                }));
                                  }
                                }));
                case /* TraditionGuildMages */9 :
                case /* PredigtDerGemeinschaft */30 :
                    break;
                case /* PredigtDesWohlgefallens */33 :
                    var partial_arg = staticData.arcaneBardTraditions;
                    return Maybe$OptolithClient.Monad.$great$great$eq(Maybe$OptolithClient.Monad.$great$great$eq(Maybe$OptolithClient.listToMaybe(heroEntry.options), getGenericId), (function (param) {
                                  return Function$OptolithClient.flip(IntMap$OptolithClient.lookup, partial_arg, param);
                                }));
                case /* PredigtWiderMissgeschicke */34 :
                    var partial_arg$1 = staticData.arcaneDancerTraditions;
                    return Maybe$OptolithClient.Monad.$great$great$eq(Maybe$OptolithClient.Monad.$great$great$eq(Maybe$OptolithClient.listToMaybe(heroEntry.options), getGenericId), (function (param) {
                                  return Function$OptolithClient.flip(IntMap$OptolithClient.lookup, partial_arg$1, param);
                                }));
                case /* Hunter */3 :
                case /* AreaKnowledge */4 :
                case /* Literacy */5 :
                case /* Language */6 :
                case /* CombatReflexes */7 :
                case /* ImprovedDodge */8 :
                case /* Feuerschlucker */14 :
                case /* CombatStyleCombination */15 :
                case /* AdaptionZauber */16 :
                case /* Exorzist */17 :
                case /* FavoriteSpellwork */18 :
                case /* TraditionWitches */19 :
                case /* MagicStyleCombination */20 :
                case /* Harmoniezauberei */21 :
                case /* Matrixzauberei */22 :
                case /* TraditionElves */23 :
                case /* TraditionDruids */24 :
                case /* Forschungsgebiet */26 :
                case /* Expertenwissen */27 :
                case /* Wissensdurst */28 :
                case /* Recherchegespuer */29 :
                case /* PredigtDerZuversicht */31 :
                case /* PredigtDesGottvertrauens */32 :
                case /* VisionDerBestimmung */35 :
                    return getDefaultNameAddition(staticEntry, heroEntry);
                case /* PropertyKnowledge */10 :
                case /* PropertyFocus */11 :
                case /* AspectKnowledge */12 :
                case /* TraditionChurchOfPraios */13 :
                case /* VisionDerEntrueckung */36 :
                    exit$1 = 2;
                    break;
                
              }
            }
          } else if (match$2 !== 0) {
            return getDefaultNameAddition(staticEntry, heroEntry);
          } else {
            return Maybe$OptolithClient.Monad.$great$great$eq(Maybe$OptolithClient.Monad.$great$great$eq(Maybe$OptolithClient.listToMaybe(heroEntry.options), (function (param) {
                              return getSkillFromOption(staticData, param);
                            })), (function (skill) {
                          return Maybe$OptolithClient.Monad.$great$great$eq(ListH$OptolithClient.$less$bang$bang$great(heroEntry.options, 1), (function (option2) {
                                        var variant = option2[0];
                                        var tmp;
                                        if (variant !== 61643255) {
                                          tmp = variant >= 931971705 ? /* Just */[option2[1]] : /* Nothing */0;
                                        } else {
                                          var id = option2[1];
                                          tmp = Maybe$OptolithClient.Functor.$less$amp$great(Curry._2(IntMap$OptolithClient.Foldable.find, (function (a) {
                                                      return a.id === id;
                                                    }), skill.applications), (function (a) {
                                                  return a.name;
                                                }));
                                        }
                                        return Maybe$OptolithClient.Functor.$less$amp$great(tmp, (function (appName) {
                                                      return skill.name + (": " + appName);
                                                    }));
                                      }));
                        }));
          }
          return Maybe$OptolithClient.Monad.$great$great$eq(Maybe$OptolithClient.Monad.$great$great$eq(Maybe$OptolithClient.listToMaybe(heroEntry.options), (function (param) {
                            return getSelectOption(staticEntry, param);
                          })), (function (enhancement) {
                        return Maybe$OptolithClient.Monad.$great$great$eq(enhancement.target, (function (id) {
                                      var tmp;
                                      var exit = 0;
                                      if (typeof match$2 === "number" && match$2 === 25) {
                                        tmp = Maybe$OptolithClient.Functor.$less$amp$great(Curry._2(IntMap$OptolithClient.lookup, id, staticData.spells), (function (x) {
                                                return x.name;
                                              }));
                                      } else {
                                        exit = 1;
                                      }
                                      if (exit === 1) {
                                        tmp = Maybe$OptolithClient.Functor.$less$amp$great(Curry._2(IntMap$OptolithClient.lookup, id, staticData.liturgicalChants), (function (x) {
                                                return x.name;
                                              }));
                                      }
                                      return Maybe$OptolithClient.Functor.$less$amp$great(tmp, (function (targetName) {
                                                    return targetName + (": " + enhancement.name);
                                                  }));
                                    }));
                      }));
        } else {
          return getDefaultNameAddition(staticEntry, heroEntry);
        }
        switch (exit$1) {
          case 1 :
              return Maybe$OptolithClient.Monad.$great$great$eq(Maybe$OptolithClient.listToMaybe(heroEntry.options), (function (sid) {
                            if (sid[0] !== 345443720) {
                              return /* Nothing */0;
                            } else {
                              return lookupMap(sid[1], staticData.spells, (function (x) {
                                            return x.name;
                                          }));
                            }
                          }));
          case 2 :
              return Maybe$OptolithClient.Functor.$less$amp$great(Maybe$OptolithClient.Monad.$great$great$eq(Maybe$OptolithClient.listToMaybe(heroEntry.options), (function (param) {
                                return getSkillFromOption(staticData, param);
                              })), (function (x) {
                            return x.name;
                          }));
          
        }
        break;
    
  }
}

function getEntrySpecificNameReplacements(staticEntry, heroEntry, nameAddition) {
  var name = staticEntry[0].name;
  var mapDefaultWithParens = function (param) {
    return Maybe$OptolithClient.maybe(name, (function (add) {
                  return name + (" (" + (add + ")"));
                }), nameAddition);
  };
  var mapDefaultWithoutParens = function (param) {
    return Maybe$OptolithClient.maybe(name, (function (add) {
                  return name + (" " + add);
                }), nameAddition);
  };
  var addSndInParens = function (snd) {
    var partial_arg = ": " + (snd + ")");
    return (function (param) {
        return ListH$OptolithClient.Extra.replaceStr(")", partial_arg, param);
      });
  };
  switch (staticEntry.tag | 0) {
    case /* Advantage */0 :
        var match = Ids$OptolithClient.AdvantageId.fromInt(staticEntry[0].id);
        if (typeof match === "number") {
          if (match >= 13) {
            if (match !== 21) {
              return mapDefaultWithParens(/* () */0);
            } else {
              return mapDefaultWithoutParens(/* () */0);
            }
          } else if (match >= 11) {
            return mapDefaultWithoutParens(/* () */0);
          } else {
            return mapDefaultWithParens(/* () */0);
          }
        } else {
          return mapDefaultWithParens(/* () */0);
        }
    case /* Disadvantage */1 :
        var match$1 = Ids$OptolithClient.DisadvantageId.fromInt(staticEntry[0].id);
        if (typeof match$1 === "number") {
          var switcher = match$1 - 13 | 0;
          if (switcher > 6 || switcher < 0) {
            if (switcher >= -12) {
              return mapDefaultWithParens(/* () */0);
            } else {
              return mapDefaultWithoutParens(/* () */0);
            }
          } else if (switcher > 5 || switcher < 1) {
            return Maybe$OptolithClient.fromMaybe(name, Maybe$OptolithClient.Monad.liftM2((function (level, nameAddition) {
                              return name + (" " + (level + (" (" + (nameAddition + ")"))));
                            }), Maybe$OptolithClient.Monad.$great$great$eq(heroEntry.level, Integers$OptolithClient.intToRoman), nameAddition));
          } else {
            return mapDefaultWithParens(/* () */0);
          }
        } else {
          return mapDefaultWithParens(/* () */0);
        }
    case /* SpecialAbility */2 :
        var match$2 = Ids$OptolithClient.SpecialAbilityId.fromInt(staticEntry[0].id);
        if (typeof match$2 === "number") {
          switch (match$2) {
            case /* GebieterDesAspekts */45 :
                return mapDefaultWithoutParens(/* () */0);
            case /* TraditionArcaneBard */49 :
                var f = function (param) {
                  return Function$OptolithClient.flip(addSndInParens, name, param);
                };
                return Maybe$OptolithClient.maybe(name, f, nameAddition);
            case /* TraditionArcaneDancer */50 :
                var f$1 = function (param) {
                  return Function$OptolithClient.flip(addSndInParens, name, param);
                };
                return Maybe$OptolithClient.maybe(name, f$1, nameAddition);
            case /* ChantEnhancement */46 :
            case /* DunklesAbbildDerBuendnisgabe */47 :
            case /* TraditionIllusionist */48 :
            case /* TraditionIntuitiveMage */51 :
                return mapDefaultWithParens(/* () */0);
            case /* TraditionSavant */52 :
                var f$2 = function (param) {
                  return Function$OptolithClient.flip(addSndInParens, name, param);
                };
                return Maybe$OptolithClient.maybe(name, f$2, nameAddition);
            default:
              return mapDefaultWithParens(/* () */0);
          }
        } else {
          return mapDefaultWithParens(/* () */0);
        }
    
  }
}

function getName(staticData, staticEntry, heroEntry) {
  var addName = getEntrySpecificNameAddition(staticData, staticEntry, heroEntry);
  var fullName = getEntrySpecificNameReplacements(staticEntry, heroEntry, addName);
  return {
          name: fullName,
          baseName: staticEntry[0].name,
          addName: addName,
          levelName: /* Nothing */0
        };
}

var Names = {
  getName: getName
};

exports.isActive = isActive;
exports.isActiveM = isActiveM;
exports.Convert = Convert;
exports.Accessors = Accessors;
exports.SelectOptions = SelectOptions;
exports.Names = Names;
/* IntMap-OptolithClient Not a pure module */
