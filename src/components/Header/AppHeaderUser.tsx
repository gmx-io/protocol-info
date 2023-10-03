import { Trans } from "@lingui/macro";

import LanguagePopupHome from "../NetworkDropdown/LanguagePopupHome";
import "./Header.css";
import { HeaderLink } from "./HeaderLink";

type Props = {
  small?: boolean;
  redirectPopupTimestamp: number;
  showRedirectModal: (to: string) => void;
};

export function AppHeaderUser({ redirectPopupTimestamp, showRedirectModal }: Props) {
  const tradeLink = true ? "/trade" : "/v2";

  return (
    <div className="App-header-user">
      <div className="App-header-trade-link homepage-header">
        <HeaderLink
          className="default-btn"
          to={tradeLink!}
          redirectPopupTimestamp={redirectPopupTimestamp}
          showRedirectModal={showRedirectModal}
        >
          <Trans>Launch App</Trans>
        </HeaderLink>
      </div>

      <LanguagePopupHome />
    </div>
  );
}
