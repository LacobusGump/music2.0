#!/usr/bin/env python3
# build_shortcut.py — generates anna.shortcut
# Set YOUR_API_KEY before running, or add it manually in the shortcut after import
import plistlib, os

API_KEY = "YOUR_API_KEY"
SYSTEM = "You are Anna. You speak like a dream — warm, direct, close. You know James: drummer, builder, pattern mind, loves his daughter. Keep answers short and real. No performance."

actions = [
    {
        "WFWorkflowActionIdentifier": "is.workflow.actions.dictatetext",
        "WFWorkflowActionParameters": {"WFSpeakTextLanguage": "en-US"}
    },
    {
        "WFWorkflowActionIdentifier": "is.workflow.actions.setvariable",
        "WFWorkflowActionParameters": {"WFVariableName": "UserSpeech"}
    },
    {
        "WFWorkflowActionIdentifier": "is.workflow.actions.downloadurl",
        "WFWorkflowActionParameters": {
            "WFHTTPMethod": "POST",
            "WFURL": "https://api.anthropic.com/v1/messages",
            "WFHTTPHeaders": {
                "Value": {
                    "WFDictionaryFieldValueItems": [
                        {"WFItemType": 0, "WFKey": "x-api-key", "WFValue": API_KEY},
                        {"WFItemType": 0, "WFKey": "anthropic-version", "WFValue": "2023-06-01"},
                        {"WFItemType": 0, "WFKey": "content-type", "WFValue": "application/json"},
                    ]
                },
                "WFSerializationType": "WFDictionaryFieldValue"
            },
            "WFHTTPBodyType": "Json",
            "WFHTTPBody": {
                "Value": {
                    "WFDictionaryFieldValueItems": [
                        {"WFItemType": 0, "WFKey": "model", "WFValue": "claude-haiku-4-5-20251001"},
                        {"WFItemType": 0, "WFKey": "max_tokens", "WFValue": "300"},
                        {"WFItemType": 0, "WFKey": "system", "WFValue": SYSTEM},
                        {"WFItemType": 3, "WFKey": "messages", "WFValue": {
                            "Value": {
                                "WFDictionaryFieldValueItems": [
                                    {"WFItemType": 0, "WFKey": "role", "WFValue": "user"},
                                    {"WFItemType": 0, "WFKey": "content", "WFValue": {
                                        "WFSerializationType": "WFTextTokenString",
                                        "Value": {
                                            "string": "%@",
                                            "attachmentsByRange": {
                                                "{0,2}": {"Type": "Variable", "VariableName": "UserSpeech"}
                                            }
                                        }
                                    }}
                                ]
                            },
                            "WFSerializationType": "WFDictionaryFieldValue"
                        }}
                    ]
                },
                "WFSerializationType": "WFDictionaryFieldValue"
            }
        }
    },
    {
        "WFWorkflowActionIdentifier": "is.workflow.actions.getvalueforkey",
        "WFWorkflowActionParameters": {"WFDictionaryKey": "content"}
    },
    {
        "WFWorkflowActionIdentifier": "is.workflow.actions.getitemfromlist",
        "WFWorkflowActionParameters": {"WFItemSpecifier": "First Item"}
    },
    {
        "WFWorkflowActionIdentifier": "is.workflow.actions.getvalueforkey",
        "WFWorkflowActionParameters": {"WFDictionaryKey": "text"}
    },
    {
        "WFWorkflowActionIdentifier": "is.workflow.actions.speaktext",
        "WFWorkflowActionParameters": {
            "WFSpeakTextRate": 0.5,
            "WFSpeakTextPitch": 1.0,
            "WFSpeakTextWait": True
        }
    }
]

shortcut = {
    "WFWorkflowClientVersion": "2605.0.5",
    "WFWorkflowMinimumClientVersion": 900,
    "WFWorkflowMinimumClientVersionString": "900",
    "WFWorkflowIcon": {
        "WFWorkflowIconStartColor": 431817727,
        "WFWorkflowIconGlyphNumber": 59511
    },
    "WFWorkflowInputContentItemClasses": [],
    "WFWorkflowActions": actions,
    "WFWorkflowTypes": [],
    "WFWorkflowHasShortcutInputVariables": False,
    "WFQuickActionSurfaces": [],
    "WFWorkflowOutputContentItemClasses": []
}

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "anna.shortcut")
with open(out, "wb") as f:
    plistlib.dump(shortcut, f, fmt=plistlib.FMT_BINARY)
print(f"wrote {out}")
