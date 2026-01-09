import FeatureHamburgerOnly from "@/components/FeatureHamburgerOnly"

interface PeerConnectHeaderProps {
  currentUser: {
    nama: string
  }
}

export default function PeerConnectHeader({ currentUser }: PeerConnectHeaderProps) {
  return <FeatureHamburgerOnly />
}
