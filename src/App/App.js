import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { SWRConfig } from "swr";
import { Route, HashRouter as Router, Switch, useHistory, useLocation } from "react-router-dom";
import { useLocalStorage } from "react-use";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

import { decodeReferralCode, encodeReferralCode } from "domain/referrals/utils";

import useScrollToTop from "lib/useScrollToTop";
import { getAppBaseUrl, REFERRAL_CODE_QUERY_PARAM } from "lib/legacy";
import useRouteQuery from "lib/useRouteQuery";
import { defaultLocale, dynamicActivate } from "lib/i18n";
import { swrGCMiddleware } from "lib/swrMiddlewares";

import { REDIRECT_POPUP_TIMESTAMP_KEY, LANGUAGE_LOCALSTORAGE_KEY, REFERRAL_CODE_KEY } from "config/localStorage";

import "styles/Font.css";
import "styles/Shared.css";
import "./App.scss";

import Home from "pages/Home/Home";
import EventToastContainer from "components/EventToast/EventToastContainer";
import useEventToast from "components/EventToast/useEventToast";

import { RedirectPopupModal } from "components/ModalViews/RedirectModal";
import PageNotFound from "pages/PageNotFound/PageNotFound";
import ReferralTerms from "pages/ReferralTerms/ReferralTerms";
import TermsAndConditions from "pages/TermsAndConditions/TermsAndConditions";

import { Header } from "components/Header/Header";
import SEO from "components/SEO/SEO";

function FullApp() {
  const location = useLocation();
  const history = useHistory();

  const query = useRouteQuery();

  useEventToast();

  useEffect(() => {
    let referralCode = query.get(REFERRAL_CODE_QUERY_PARAM);
    if (!referralCode || referralCode.length === 0) {
      const params = new URLSearchParams(window.location.search);
      referralCode = params.get(REFERRAL_CODE_QUERY_PARAM);
    }

    if (referralCode && referralCode.length <= 20) {
      const encodedReferralCode = encodeReferralCode(referralCode);
      if (encodedReferralCode !== ethers.constants.HashZero) {
        localStorage.setItem(REFERRAL_CODE_KEY, encodedReferralCode);
        const queryParams = new URLSearchParams(location.search);
        if (queryParams.has(REFERRAL_CODE_QUERY_PARAM)) {
          queryParams.delete(REFERRAL_CODE_QUERY_PARAM);
          history.replace({
            search: queryParams.toString(),
          });
        }
      }
    }
  }, [query, history, location]);

  const [redirectModalVisible, setRedirectModalVisible] = useState(false);
  const [shouldHideRedirectModal, setShouldHideRedirectModal] = useState(false);
  const [redirectPopupTimestamp, setRedirectPopupTimestamp] = useLocalStorage(REDIRECT_POPUP_TIMESTAMP_KEY);
  const [selectedToPage, setSelectedToPage] = useState("");

  const localStorageCode = window.localStorage.getItem(REFERRAL_CODE_KEY);
  const baseUrl = getAppBaseUrl();
  let appRedirectUrl = baseUrl + selectedToPage;
  if (localStorageCode && localStorageCode.length > 0 && localStorageCode !== ethers.constants.HashZero) {
    const decodedRefCode = decodeReferralCode(localStorageCode);
    if (decodedRefCode) {
      appRedirectUrl = `${appRedirectUrl}?ref=${decodedRefCode}`;
    }
  }

  const showRedirectModal = (to) => {
    setRedirectModalVisible(true);
    setSelectedToPage(to);
  };

  return (
    <>
      <div className="App">
        <div className="App-content">
          <Header redirectPopupTimestamp={redirectPopupTimestamp} showRedirectModal={showRedirectModal} />
          <Switch>
            <Route exact path="/">
              <Home showRedirectModal={showRedirectModal} redirectPopupTimestamp={redirectPopupTimestamp} />
            </Route>
            <Route exact path="/referral-terms">
              <ReferralTerms />
            </Route>
            <Route exact path="/terms-and-conditions">
              <TermsAndConditions />
            </Route>
            <Route path="*">
              <PageNotFound />
            </Route>
          </Switch>
        </div>
      </div>
      <EventToastContainer />
      <RedirectPopupModal
        redirectModalVisible={redirectModalVisible}
        setRedirectModalVisible={setRedirectModalVisible}
        appRedirectUrl={appRedirectUrl}
        setRedirectPopupTimestamp={setRedirectPopupTimestamp}
        setShouldHideRedirectModal={setShouldHideRedirectModal}
        shouldHideRedirectModal={shouldHideRedirectModal}
      />
    </>
  );
}

function App() {
  useScrollToTop();

  useEffect(() => {
    const defaultLanguage = localStorage.getItem(LANGUAGE_LOCALSTORAGE_KEY) || defaultLocale;
    dynamicActivate(defaultLanguage);
  }, []);

  return (
    <SWRConfig
      value={{ refreshInterval: 5000, refreshWhenHidden: false, refreshWhenOffline: false, use: [swrGCMiddleware] }}
    >
      <SEO>
        <Router>
          <I18nProvider i18n={i18n}>
            <FullApp />
          </I18nProvider>
        </Router>
      </SEO>
    </SWRConfig>
  );
}

export default App;
