import MessageThread from '../MessageThread'

export default function MessageThreadExample() {
  return (
    <div className="p-4">
      <MessageThread 
        recipientName="Sarah Johnson"
        listingTitle="Vintage Leather Sofa - Excellent Condition"
      />
    </div>
  )
}
