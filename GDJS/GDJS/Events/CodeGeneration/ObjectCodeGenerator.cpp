/*
 * GDevelop JS Platform
 * Copyright 2008-2016 Florian Rival (Florian.Rival@gmail.com). All rights
 * reserved. This project is released under the MIT License.
 */
#include "ObjectCodeGenerator.h"

#include "EventsCodeGenerator.h"

namespace gdjs {

gd::String ObjectCodeGenerator::onCreatedFunctionName =
    "onCreated";

gd::String ObjectCodeGenerator::doStepPreEventsFunctionName =
    "doStepPreEvents";

gd::String ObjectCodeGenerator::GenerateRuntimeObjectCompleteCode(
    const gd::String& extensionName,
    const gd::EventsBasedObject& eventsBasedObject,
    const gd::String& codeNamespace,
    const std::map<gd::String, gd::String>& objectMethodMangledNames,
    std::set<gd::String>& includeFiles,
    bool compilationForRuntime) {
  auto& eventsFunctionsVector =
      eventsBasedObject.GetEventsFunctions().GetInternalVector();

  return GenerateRuntimeObjectTemplateCode(
      extensionName,
      eventsBasedObject,
      codeNamespace,
      [&]() {
        gd::String runtimeObjectDataInitializationCode;
        for (auto& property :
             eventsBasedObject.GetPropertyDescriptors().GetInternalVector()) {
          runtimeObjectDataInitializationCode +=
              property->IsHidden()
                  ? GenerateInitializePropertyFromDefaultValueCode(*property)
                  : GenerateInitializePropertyFromDataCode(*property);
        }

        return runtimeObjectDataInitializationCode;
      },
      [&]() {
        gd::String runtimeObjectPropertyMethodsCode;
        for (auto& property :
             eventsBasedObject.GetPropertyDescriptors().GetInternalVector()) {
          runtimeObjectPropertyMethodsCode +=
              GenerateRuntimeObjectPropertyTemplateCode(
                  eventsBasedObject, *property);
        }

        return runtimeObjectPropertyMethodsCode;
      },
      // TODO: Update code generation to be able to generate methods (which would allow
      // for a cleaner output, not having to add methods to the prototype).
      [&]() {
        gd::String runtimeObjectMethodsCode;
        for (auto& eventsFunction : eventsFunctionsVector) {
          const gd::String& functionName =
              objectMethodMangledNames.find(eventsFunction->GetName()) !=
                      objectMethodMangledNames.end()
                  ? objectMethodMangledNames.find(eventsFunction->GetName())
                        ->second
                  : "UNKNOWN_FUNCTION_fix_objectMethodMangledNames_please";
          gd::String methodCodeNamespace =
              codeNamespace + "." + eventsBasedObject.GetName() +
              ".prototype." + functionName + "Context";
          gd::String methodFullyQualifiedName = codeNamespace + "." +
                                                eventsBasedObject.GetName() +
                                                ".prototype." + functionName;
          runtimeObjectMethodsCode +=
              EventsCodeGenerator::GenerateObjectEventsFunctionCode(
                  project,
                  eventsBasedObject,
                  *eventsFunction,
                  methodCodeNamespace,
                  methodFullyQualifiedName,
                  "that._onceTriggers",
                  functionName == doStepPreEventsFunctionName
                      ? GenerateDoStepPreEventsPreludeCode()
                      : "",
                  functionName == onCreatedFunctionName
                      ? "gdjs.CustomRuntimeObject.prototype.onCreated.call(this);\n"
                      : "",
                  includeFiles,
                  compilationForRuntime);
        }

        bool hasDoStepPreEventsFunction =
            eventsBasedObject.GetEventsFunctions().HasEventsFunctionNamed(
                doStepPreEventsFunctionName);
        if (!hasDoStepPreEventsFunction) {
          runtimeObjectMethodsCode +=
              GenerateDefaultDoStepPreEventsFunctionCode(eventsBasedObject,
                                                         codeNamespace);
        }

        return runtimeObjectMethodsCode;
      },
      [&]() {
        gd::String updateFromObjectCode;
        updateFromObjectCode += "super.updateFromObjectData(oldObjectData, newObjectData);";
        for (auto& property :
             eventsBasedObject.GetPropertyDescriptors().GetInternalVector()) {
          updateFromObjectCode +=
              GenerateUpdatePropertyFromObjectDataCode(
                  eventsBasedObject, *property);
        }

        return updateFromObjectCode;
      });
}

gd::String ObjectCodeGenerator::GenerateRuntimeObjectTemplateCode(
    const gd::String& extensionName,
    const gd::EventsBasedObject& eventsBasedObject,
    const gd::String& codeNamespace,
    std::function<gd::String()> generateInitializePropertiesCode,
    std::function<gd::String()> generatePropertiesCode,
    std::function<gd::String()> generateMethodsCode,
    std::function<gd::String()> generateUpdateFromObjectDataCode) {
  return gd::String(R"jscode_template(
CODE_NAMESPACE = CODE_NAMESPACE || {};

/**
 * Object generated from OBJECT_FULL_NAME
 */
CODE_NAMESPACE.RUNTIME_OBJECT_CLASSNAME = class RUNTIME_OBJECT_CLASSNAME extends gdjs.CustomRuntimeObject {
  constructor(runtimeScene, objectData) {
    super(runtimeScene, objectData);
    this._runtimeScene = runtimeScene;

    this._onceTriggers = new gdjs.OnceTriggers();
    this._behaviorData = {};
    INITIALIZE_PROPERTIES_CODE
  }

  // Hot-reload:
  updateFromObjectData(oldObjectData, newObjectData) {
    UPDATE_FROM_OBJECT_DATA_CODE

    this.onHotReloading(this.getInstanceContainer());
    return true;
  }

  // Properties:
  PROPERTIES_CODE
}

// Methods:
METHODS_CODE

gdjs.registerObject("EXTENSION_NAME::OBJECT_NAME", CODE_NAMESPACE.RUNTIME_OBJECT_CLASSNAME);
)jscode_template")
      .FindAndReplace("EXTENSION_NAME", extensionName)
      .FindAndReplace("OBJECT_NAME", eventsBasedObject.GetName())
      .FindAndReplace("OBJECT_FULL_NAME", eventsBasedObject.GetFullName())
      .FindAndReplace("RUNTIME_OBJECT_CLASSNAME",
                      eventsBasedObject.GetName())
      .FindAndReplace("CODE_NAMESPACE", codeNamespace)
      .FindAndReplace("INITIALIZE_PROPERTIES_CODE",
                      generateInitializePropertiesCode())
      .FindAndReplace("UPDATE_FROM_OBJECT_DATA_CODE", generateUpdateFromObjectDataCode())
      .FindAndReplace("PROPERTIES_CODE", generatePropertiesCode())
      .FindAndReplace("METHODS_CODE", generateMethodsCode());
  ;
}
// TODO these 2 methods are probably not needed if the properties are merged by GDJS.
gd::String ObjectCodeGenerator::GenerateInitializePropertyFromDataCode(
    const gd::NamedPropertyDescriptor& property) {
  return gd::String(R"jscode_template(
    this._objectData.content.PROPERTY_NAME = objectData.content.PROPERTY_NAME !== undefined ? objectData.content.PROPERTY_NAME : DEFAULT_VALUE;)jscode_template")
      .FindAndReplace("PROPERTY_NAME", property.GetName())
      .FindAndReplace("DEFAULT_VALUE", GeneratePropertyValueCode(property));
}
gd::String
ObjectCodeGenerator::GenerateInitializePropertyFromDefaultValueCode(
    const gd::NamedPropertyDescriptor& property) {
  return gd::String(R"jscode_template(
    this._objectData.content.PROPERTY_NAME = DEFAULT_VALUE;)jscode_template")
      .FindAndReplace("PROPERTY_NAME", property.GetName())
      .FindAndReplace("DEFAULT_VALUE", GeneratePropertyValueCode(property));
}

gd::String ObjectCodeGenerator::GenerateRuntimeObjectPropertyTemplateCode(
    const gd::EventsBasedObject& eventsBasedObject,
    const gd::NamedPropertyDescriptor& property) {
  return gd::String(R"jscode_template(
  GETTER_NAME() {
    return this._objectData.content.PROPERTY_NAME !== undefined ? this._objectData.content.PROPERTY_NAME : DEFAULT_VALUE;
  }
  SETTER_NAME(newValue) {
    this._objectData.content.PROPERTY_NAME = newValue;
  })jscode_template")
      .FindAndReplace("PROPERTY_NAME", property.GetName())
      .FindAndReplace("GETTER_NAME",
                      GetObjectPropertyGetterName(property.GetName()))
      .FindAndReplace("SETTER_NAME",
                      GetObjectPropertySetterName(property.GetName()))
      .FindAndReplace("DEFAULT_VALUE", GeneratePropertyValueCode(property))
      .FindAndReplace("RUNTIME_OBJECT_CLASSNAME",
                      eventsBasedObject.GetName());
}

gd::String ObjectCodeGenerator::GenerateUpdatePropertyFromObjectDataCode(
    const gd::EventsBasedObject& eventsBasedObject,
    const gd::NamedPropertyDescriptor& property) {
  return gd::String(R"jscode_template(
    if (oldObjectData.content.PROPERTY_NAME !== newObjectData.content.PROPERTY_NAME)
      this._objectData.content.PROPERTY_NAME = newObjectData.content.PROPERTY_NAME;)jscode_template")
      .FindAndReplace("PROPERTY_NAME", property.GetName());
}

gd::String ObjectCodeGenerator::GeneratePropertyValueCode(
    const gd::PropertyDescriptor& property) {
  if (property.GetType() == "String" ||
      property.GetType() == "Choice" ||
      property.GetType() == "Color") {
    return EventsCodeGenerator::ConvertToStringExplicit(property.GetValue());
  } else if (property.GetType() == "Number") {
    return "Number(" +
           EventsCodeGenerator::ConvertToStringExplicit(property.GetValue()) +
           ") || 0";
  } else if (property.GetType() == "Boolean") {  // TODO: Check if working
    return property.GetValue() == "true" ? "true" : "false";
  }

  return "0 /* Error: property was of an unrecognized type */";
}

gd::String ObjectCodeGenerator::GenerateDefaultDoStepPreEventsFunctionCode(
    const gd::EventsBasedObject& eventsBasedObject,
    const gd::String& codeNamespace) {
  return gd::String(R"jscode_template(
CODE_NAMESPACE.RUNTIME_OBJECT_CLASSNAME.prototype.doStepPreEvents = function() {
  PRELUDE_CODE
};
)jscode_template")
      .FindAndReplace("RUNTIME_OBJECT_CLASSNAME",
                      eventsBasedObject.GetName())
      .FindAndReplace("CODE_NAMESPACE", codeNamespace)
      .FindAndReplace("PRELUDE_CODE", GenerateDoStepPreEventsPreludeCode());
}

gd::String ObjectCodeGenerator::GenerateDoStepPreEventsPreludeCode() {
  return "this._onceTriggers.startNewFrame();";
}

}  // namespace gdjs
