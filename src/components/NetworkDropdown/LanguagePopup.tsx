import React, { useRef, useState } from "react";
import ModalWithPortal from "../Modal/ModalWithPortal";
import { t } from "@lingui/macro";
import "./LanguagePopup.css";
import language24Icon from "img/ic_language24.svg";
import { defaultLocale } from "lib/i18n";
import { LANGUAGE_LOCALSTORAGE_KEY } from "config/localStorage";
import LanguageModalContent from "./LanguageModalContent";

export default function LanguagePopup() {
  const currentLanguage = useRef(localStorage.getItem(LANGUAGE_LOCALSTORAGE_KEY) || defaultLocale);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  return (
    <>
      <div className="Language-selector-modal App-header-language" onClick={() => setIsLanguageModalOpen(true)}>
        <div className="language-dropdown homepage-header">
          <button className="transparent">
            <img className="language-dropdown-icon" src={language24Icon} alt="Select Language" />
          </button>
        </div>
      </div>

      <ModalWithPortal
        className="language-popup"
        isVisible={isLanguageModalOpen}
        setIsVisible={setIsLanguageModalOpen}
        label={t`Select Language`}
      >
        <LanguageModalContent currentLanguage={currentLanguage} />
      </ModalWithPortal>
    </>
  );
}
